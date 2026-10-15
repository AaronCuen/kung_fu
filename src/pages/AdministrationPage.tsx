import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/Feedback'
import { Icon } from '../components/ui/Icon'
import { Modal } from '../components/ui/Modal'
import { ModulePage } from '../components/ui/ModulePage'
import { StatusBadge } from '../components/ui/StatusBadge'
import { api, getErrorMessage } from '../lib/api'
import { formatCurrency } from '../lib/format'
import type { Category, Extra, MessageResponse, Permission, Product, ProductConfiguration, RestaurantTable, User, UserRole } from '../types/api'

type AdminSection = 'tables' | 'users' | 'menu'
type MenuSection = 'products' | 'categories' | 'extras'
type Dialog = 'table' | 'user' | 'product' | 'category' | 'extra' | null
type UserForm = { nombre: string; usuario: string; password: string; rol: UserRole; permisos: string[] }
type PresentationForm = { nombre: string; cantidad_piezas: string; precio: string }
type ProductForm = {
  id_categoria: string
  numero: string
  nombre: string
  descripcion: string
  configuracion: ProductConfiguration
  precio: string
  presentaciones: PresentationForm[]
  cantidad_incluida: string
  cantidad_maxima: string
  precio_seleccion_extra: string
  opciones: string[]
}
type ExtraForm = { nombre: string; precio: string }

const roleLabels: Record<UserRole, string> = { ADMIN: 'Administrador', MESERA: 'Mesera', COCINA: 'Cocina', RECEPCIONISTA: 'Recepcionista' }
const rolePermissions: Record<Exclude<UserRole, 'ADMIN'>, string[]> = {
  MESERA: ['catalogo.ver', 'mesas.ver', 'cuentas.crear', 'cuentas.ver_propias', 'cuentas.editar', 'cuentas.cancelar', 'comandas.crear', 'comandas.cancelar'],
  COCINA: ['comandas.ver_cocina', 'comandas.actualizar_estado', 'comandas.cancelar'],
  RECEPCIONISTA: ['catalogo.ver', 'mesas.ver', 'cuentas.crear', 'cuentas.ver_todas', 'cuentas.editar', 'cuentas.cancelar', 'comandas.crear', 'comandas.cancelar', 'pagos.registrar', 'reportes.ver', 'cortes.realizar'],
}
const emptyUserForm: UserForm = { nombre: '', usuario: '', password: '', rol: 'MESERA', permisos: rolePermissions.MESERA }
const emptyProductForm: ProductForm = {
  id_categoria: '', numero: '', nombre: '', descripcion: '', configuracion: 'NORMAL', precio: '', presentaciones: [],
  cantidad_incluida: '3', cantidad_maxima: '4', precio_seleccion_extra: '50', opciones: [''],
}
const emptyExtraForm: ExtraForm = { nombre: '', precio: '' }

export function AdministrationPage() {
  const { user: currentUser, refreshUser } = useAuth()
  const [section, setSection] = useState<AdminSection>('tables')
  const [menuSection, setMenuSection] = useState<MenuSection>('products')
  const [dialog, setDialog] = useState<Dialog>(null)
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [extras, setExtras] = useState<Extra[]>([])
  const [tableNumber, setTableNumber] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [userForm, setUserForm] = useState<UserForm>(emptyUserForm)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [editingExtra, setEditingExtra] = useState<Extra | null>(null)
  const [extraForm, setExtraForm] = useState<ExtraForm>(emptyExtraForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingTableId, setDeletingTableId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [tableRows, userRows, permissionRows, categoryRows, productRows, extraRows] = await Promise.all([
        api.get<RestaurantTable[]>('/tables'), api.get<User[]>('/users'), api.get<Permission[]>('/users/permissions'),
        api.get<Category[]>('/categories'), api.get<Product[]>('/products'), api.get<Extra[]>('/extras'),
      ])
      setTables(tableRows); setUsers(userRows); setPermissions(permissionRows)
      setCategories(categoryRows); setProducts(productRows); setExtras(extraRows)
    } catch (cause) { setError(getErrorMessage(cause)) } finally { setLoading(false) }
  }, [])

  useEffect(() => { void loadData() }, [loadData])

  const createTable = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError(null)
    try { await api.post('/tables', { numero: Number(tableNumber) }); setDialog(null); setTableNumber(''); await loadData() }
    catch (cause) { setError(getErrorMessage(cause)) } finally { setSaving(false) }
  }

  const deleteTable = async (table: RestaurantTable) => {
    if (!window.confirm(`¿Eliminar la mesa ${table.numero}?`)) return
    setDeletingTableId(table.id_mesa); setError(null)
    try { await api.delete<MessageResponse>(`/tables/${table.id_mesa}`); await loadData() }
    catch (cause) { setError(getErrorMessage(cause)) } finally { setDeletingTableId(null) }
  }

  const permissionsForRole = (role: UserRole) => role === 'ADMIN' ? permissions.map((item) => item.codigo) : rolePermissions[role]
  const openUser = (selected?: User) => {
    setEditingUser(selected || null)
    setUserForm(selected ? { nombre: selected.nombre, usuario: selected.usuario, password: '', rol: selected.rol, permisos: selected.permisos } : { ...emptyUserForm, permisos: [...rolePermissions.MESERA] })
    setError(null); setDialog('user')
  }
  const saveUser = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError(null)
    try {
      if (editingUser) {
        await api.patch(`/users/${editingUser.id_usuario}`, { nombre: userForm.nombre, usuario: userForm.usuario, rol: userForm.rol, ...(userForm.password ? { password: userForm.password } : {}) })
        await api.put(`/users/${editingUser.id_usuario}/permissions`, { permisos: userForm.permisos })
        if (editingUser.id_usuario === currentUser?.id_usuario) await refreshUser()
      } else await api.post('/users', userForm)
      setDialog(null); await loadData()
    } catch (cause) { setError(getErrorMessage(cause)) } finally { setSaving(false) }
  }
  const toggleUser = async (selected: User) => {
    if (selected.id_usuario === currentUser?.id_usuario) return
    setError(null)
    try { await api.patch(`/users/${selected.id_usuario}`, { activo: !selected.activo }); await loadData() }
    catch (cause) { setError(getErrorMessage(cause)) }
  }

  const openCategory = (selected?: Category) => {
    setEditingCategory(selected || null); setCategoryName(selected?.nombre || ''); setError(null); setDialog('category')
  }
  const saveCategory = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError(null)
    try {
      if (editingCategory) await api.patch(`/categories/${editingCategory.id_categoria}`, { nombre: categoryName })
      else await api.post('/categories', { nombre: categoryName })
      setDialog(null); await loadData()
    } catch (cause) { setError(getErrorMessage(cause)) } finally { setSaving(false) }
  }
  const deleteCategory = async (category: Category) => {
    if (!window.confirm(`¿Eliminar la sección “${category.nombre}”?`)) return
    setError(null)
    try { await api.delete(`/categories/${category.id_categoria}`); await loadData() }
    catch (cause) { setError(getErrorMessage(cause)) }
  }

  const openProduct = (selected?: Product) => {
    setEditingProduct(selected || null)
    setProductForm(selected ? {
      id_categoria: String(selected.id_categoria), numero: selected.numero ? String(selected.numero) : '', nombre: selected.nombre,
      descripcion: selected.descripcion || '', configuracion: selected.configuracion, precio: String(selected.precio),
      presentaciones: selected.presentaciones.map((item) => ({ nombre: item.nombre, cantidad_piezas: item.cantidad_piezas ? String(item.cantidad_piezas) : '', precio: String(item.precio) })),
      cantidad_incluida: String(selected.combo?.cantidad_incluida ?? 3), cantidad_maxima: String(selected.combo?.cantidad_maxima ?? 4),
      precio_seleccion_extra: String(selected.combo?.precio_seleccion_extra ?? 50), opciones: selected.combo?.opciones.map((item) => item.nombre) || [''],
    } : { ...emptyProductForm, presentaciones: [], opciones: [''], id_categoria: categories[0] ? String(categories[0].id_categoria) : '' })
    setError(null); setDialog('product')
  }
  const saveProduct = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError(null)
    const body = {
      id_categoria: Number(productForm.id_categoria), numero: productForm.numero ? Number(productForm.numero) : null,
      nombre: productForm.nombre, descripcion: productForm.descripcion || null, configuracion: productForm.configuracion,
      precio: Number(productForm.precio),
      presentaciones: productForm.configuracion === 'NORMAL' ? productForm.presentaciones.filter((item) => item.nombre && item.precio).map((item) => ({ nombre: item.nombre, cantidad_piezas: item.cantidad_piezas ? Number(item.cantidad_piezas) : null, precio: Number(item.precio) })) : [],
      combo: productForm.configuracion === 'COMBO' ? {
        cantidad_incluida: Number(productForm.cantidad_incluida), cantidad_maxima: Number(productForm.cantidad_maxima),
        precio_seleccion_extra: Number(productForm.precio_seleccion_extra), opciones: productForm.opciones.filter((item) => item.trim()),
      } : null,
    }
    try {
      if (editingProduct) await api.patch(`/products/${editingProduct.id_producto}`, body)
      else await api.post('/products', body)
      setDialog(null); await loadData()
    } catch (cause) { setError(getErrorMessage(cause)) } finally { setSaving(false) }
  }
  const deleteProduct = async (product: Product) => {
    if (!window.confirm(`¿Eliminar “${product.nombre}” del menú?`)) return
    setError(null)
    try { await api.delete(`/products/${product.id_producto}`); await loadData() }
    catch (cause) { setError(getErrorMessage(cause)) }
  }

  const openExtra = (selected?: Extra) => {
    setEditingExtra(selected || null); setExtraForm(selected ? { nombre: selected.nombre, precio: String(selected.precio) } : emptyExtraForm)
    setError(null); setDialog('extra')
  }
  const saveExtra = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError(null)
    const body = { nombre: extraForm.nombre, precio: Number(extraForm.precio) }
    try {
      if (editingExtra) await api.patch(`/extras/${editingExtra.id_extra}`, body)
      else await api.post('/extras', body)
      setDialog(null); await loadData()
    } catch (cause) { setError(getErrorMessage(cause)) } finally { setSaving(false) }
  }
  const deleteExtra = async (extra: Extra) => {
    if (!window.confirm(`¿Eliminar el extra “${extra.nombre}”?`)) return
    setError(null)
    try { await api.delete(`/extras/${extra.id_extra}`); await loadData() }
    catch (cause) { setError(getErrorMessage(cause)) }
  }

  let action: ReactNode
  if (section === 'tables') action = <button className="button button--primary" onClick={() => { setTableNumber(''); setError(null); setDialog('table') }} type="button"><Icon name="plus" size={18} />Agregar mesa</button>
  else if (section === 'users') action = <button className="button button--primary" onClick={() => openUser()} type="button"><Icon name="plus" size={18} />Agregar usuario</button>
  else if (menuSection === 'products') action = <button className="button button--primary" disabled={!categories.length} onClick={() => openProduct()} type="button"><Icon name="plus" size={18} />Agregar producto</button>
  else if (menuSection === 'categories') action = <button className="button button--primary" onClick={() => openCategory()} type="button"><Icon name="plus" size={18} />Agregar sección</button>
  else action = <button className="button button--primary" onClick={() => openExtra()} type="button"><Icon name="plus" size={18} />Agregar extra</button>

  let content: ReactNode
  if (loading) content = <LoadingState label="Cargando panel…" />
  else if (section === 'tables') content = <section className="panel tables-panel"><div className="panel__header"><div><p className="section-kicker">Salón</p><h2>Mesas</h2></div><StatusBadge tone="neutral">{tables.length} registradas</StatusBadge></div>{!tables.length ? <EmptyState title="Sin mesas" message="Agrega la primera mesa indicando su número." /> : <div className="table-cards">{tables.map((table) => <article key={table.id_mesa}><span className="table-card__number">{table.numero}</span><div><strong>Mesa {table.numero}</strong><small>Disponible para asignar cuentas</small></div><button className="button button--danger-soft button--compact" disabled={deletingTableId === table.id_mesa} onClick={() => void deleteTable(table)} type="button"><Icon name="close" size={15} />Eliminar</button></article>)}</div>}</section>
  else if (section === 'users') content = <section className="panel"><div className="panel__header"><div><p className="section-kicker">Equipo</p><h2>Usuarios</h2></div><StatusBadge tone="neutral">{users.filter((item) => item.activo).length} activos</StatusBadge></div><div className="user-list">{users.map((item) => <article className="user-row" key={item.id_usuario}><span className={`user-avatar user-avatar--${item.rol === 'ADMIN' ? 'gold' : item.rol === 'COCINA' ? 'neutral' : item.rol === 'RECEPCIONISTA' ? 'green' : 'red'}`}>{item.nombre.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</span><div className="user-row__identity"><h3>{item.nombre}</h3><p>@{item.usuario}</p></div><StatusBadge tone={item.rol === 'ADMIN' ? 'gold' : 'neutral'}>{roleLabels[item.rol]}</StatusBadge><button className={`toggle-control${item.activo ? ' is-on' : ''}`} disabled={item.id_usuario === currentUser?.id_usuario} onClick={() => void toggleUser(item)} type="button"><span />{item.activo ? 'Activo' : 'Inactivo'}</button><button className="icon-button icon-button--soft" onClick={() => openUser(item)} type="button"><Icon name="settings" size={17} /></button></article>)}</div></section>
  else content = <div className="menu-management">
    <div className="menu-subtabs"><button className={menuSection === 'products' ? 'is-active' : ''} onClick={() => setMenuSection('products')} type="button">Productos</button><button className={menuSection === 'categories' ? 'is-active' : ''} onClick={() => setMenuSection('categories')} type="button">Secciones</button><button className={menuSection === 'extras' ? 'is-active' : ''} onClick={() => setMenuSection('extras')} type="button">Extras</button></div>
    {menuSection === 'products' ? <section className="panel"><div className="panel__header"><div><p className="section-kicker">Carta</p><h2>Productos del menú</h2></div><StatusBadge tone="neutral">{products.length}</StatusBadge></div>{!categories.length ? <EmptyState title="Primero crea una sección" message="Por ejemplo: Bebidas, Porciones, Sopas u Órdenes." /> : !products.length ? <EmptyState title="Menú vacío" message="Agrega el primer producto del menú." /> : <div className="management-list">{products.map((product) => <article key={product.id_producto}><StatusBadge tone={product.configuracion === 'COMBO' ? 'gold' : 'neutral'}>{product.configuracion === 'COMBO' ? 'Combo' : product.numero ? `#${product.numero}` : 'Producto'}</StatusBadge><div><strong>{product.nombre}</strong><small>{product.categoria}{product.presentaciones.length ? ` · ${product.presentaciones.length} presentaciones` : ''}{product.descripcion ? ` · ${product.descripcion}` : ''}</small></div><strong>{formatCurrency(product.precio)}</strong><div className="row-actions"><button className="icon-button icon-button--soft" onClick={() => openProduct(product)} type="button"><Icon name="settings" size={16} /></button><button className="icon-button icon-button--danger" onClick={() => void deleteProduct(product)} type="button"><Icon name="close" size={16} /></button></div></article>)}</div>}</section>
      : menuSection === 'categories' ? <section className="panel"><div className="panel__header"><div><p className="section-kicker">Organización</p><h2>Secciones del menú</h2></div><StatusBadge tone="neutral">{categories.length}</StatusBadge></div>{!categories.length ? <EmptyState title="Sin secciones" message="Crea secciones como Bebidas, Porciones, Sopas u Órdenes." /> : <div className="management-list">{categories.map((category) => <article key={category.id_categoria}><div><strong>{category.nombre}</strong><small>{products.filter((item) => item.id_categoria === category.id_categoria).length} productos</small></div><div className="row-actions"><button className="icon-button icon-button--soft" onClick={() => openCategory(category)} type="button"><Icon name="settings" size={16} /></button><button className="icon-button icon-button--danger" onClick={() => void deleteCategory(category)} type="button"><Icon name="close" size={16} /></button></div></article>)}</div>}</section>
        : <section className="panel"><div className="panel__header"><div><p className="section-kicker">Agregables</p><h2>Extras</h2></div><StatusBadge tone="neutral">{extras.length}</StatusBadge></div>{!extras.length ? <EmptyState title="Sin extras" message="Agrega opciones como arroz extra o pollo extra." /> : <div className="management-list">{extras.map((extra) => <article key={extra.id_extra}><div><strong>{extra.nombre}</strong><small>Costo adicional</small></div><strong>+{formatCurrency(extra.precio)}</strong><div className="row-actions"><button className="icon-button icon-button--soft" onClick={() => openExtra(extra)} type="button"><Icon name="settings" size={16} /></button><button className="icon-button icon-button--danger" onClick={() => void deleteExtra(extra)} type="button"><Icon name="close" size={16} /></button></div></article>)}</div>}</section>}
  </div>

  return <ModulePage action={action} description="Gestiona cada parte por separado para mantenerlo sencillo." eyebrow="Solo administradores" title="Panel de gestión">
    <div className="admin-tabs" role="tablist"><button className={section === 'tables' ? 'is-active' : ''} onClick={() => setSection('tables')} type="button"><Icon name="dine-in" size={18} />Mesas</button><button className={section === 'users' ? 'is-active' : ''} onClick={() => setSection('users')} type="button"><Icon name="users" size={18} />Usuarios</button><button className={section === 'menu' ? 'is-active' : ''} onClick={() => setSection('menu')} type="button"><Icon name="orders" size={18} />Menú</button></div>
    {error && !dialog && <div className="admin-message"><ErrorState message={error} onRetry={loadData} /></div>}
    {content}

    <Modal description="Solo necesitamos el número que identificará la mesa." onClose={() => setDialog(null)} open={dialog === 'table'} size="small" title="Agregar mesa"><form className="stack-form" onSubmit={createTable}><label className="form-field"><span>Número de mesa</span><input autoFocus min="1" onChange={(event) => setTableNumber(event.target.value)} required type="number" value={tableNumber} /></label>{error && <ErrorState message={error} />}<div className="form-actions"><button className="button button--secondary" onClick={() => setDialog(null)} type="button">Cancelar</button><button className="button button--primary" disabled={saving} type="submit">Agregar mesa</button></div></form></Modal>
    <Modal description="Los permisos se asignarán automáticamente según el rol." onClose={() => setDialog(null)} open={dialog === 'user'} title={editingUser ? 'Editar usuario' : 'Agregar usuario'}><form className="stack-form" onSubmit={saveUser}><div className="form-grid"><label className="form-field"><span>Nombre</span><input onChange={(event) => setUserForm((current) => ({ ...current, nombre: event.target.value }))} required value={userForm.nombre} /></label><label className="form-field"><span>Usuario</span><input onChange={(event) => setUserForm((current) => ({ ...current, usuario: event.target.value }))} required value={userForm.usuario} /></label><label className="form-field"><span>Contraseña {editingUser && '(opcional)'}</span><input minLength={8} onChange={(event) => setUserForm((current) => ({ ...current, password: event.target.value }))} required={!editingUser} type="password" value={userForm.password} /></label><label className="form-field"><span>Rol</span><select disabled={editingUser?.id_usuario === currentUser?.id_usuario} onChange={(event) => { const rol = event.target.value as UserRole; setUserForm((current) => ({ ...current, rol, permisos: permissionsForRole(rol) })) }} value={userForm.rol}>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div><p className="form-note">El rol define automáticamente lo que esta persona puede ver y hacer.</p>{error && <ErrorState message={error} />}<div className="form-actions"><button className="button button--secondary" onClick={() => setDialog(null)} type="button">Cancelar</button><button className="button button--primary" disabled={saving} type="submit">Guardar</button></div></form></Modal>
    <Modal onClose={() => setDialog(null)} open={dialog === 'category'} size="small" title={editingCategory ? 'Editar sección' : 'Agregar sección'}><form className="stack-form" onSubmit={saveCategory}><label className="form-field"><span>Nombre</span><input autoFocus onChange={(event) => setCategoryName(event.target.value)} placeholder="Ej. Bebidas" required value={categoryName} /></label>{error && <ErrorState message={error} />}<div className="form-actions"><button className="button button--secondary" onClick={() => setDialog(null)} type="button">Cancelar</button><button className="button button--primary" disabled={saving} type="submit">Guardar</button></div></form></Modal>
    <Modal description="Configura un producto normal, un platillo numerado o un combo para elegir." onClose={() => setDialog(null)} open={dialog === 'product'} size="large" title={editingProduct ? 'Editar producto' : 'Agregar producto'}><form className="stack-form" onSubmit={saveProduct}>
      <div className="form-grid">
        <label className="form-field"><span>Sección</span><select onChange={(event) => setProductForm((current) => ({ ...current, id_categoria: event.target.value }))} required value={productForm.id_categoria}>{categories.map((category) => <option key={category.id_categoria} value={category.id_categoria}>{category.nombre}</option>)}</select></label>
        <label className="form-field"><span>Número del platillo (opcional)</span><input min="1" onChange={(event) => setProductForm((current) => ({ ...current, numero: event.target.value }))} placeholder="Ej. 12" type="number" value={productForm.numero} /></label>
        <label className="form-field"><span>Nombre</span><input autoFocus onChange={(event) => setProductForm((current) => ({ ...current, nombre: event.target.value }))} required value={productForm.nombre} /></label>
        <label className="form-field"><span>Precio base</span><input min="0.01" onChange={(event) => setProductForm((current) => ({ ...current, precio: event.target.value }))} required step="0.01" type="number" value={productForm.precio} /></label>
        <label className="form-field"><span>Forma de venta</span><select onChange={(event) => setProductForm((current) => ({ ...current, configuracion: event.target.value as ProductConfiguration }))} value={productForm.configuracion}><option value="NORMAL">Producto normal</option><option value="COMBO">Combo para elegir</option></select></label>
        <label className="form-field form-field--full"><span>Descripción</span><textarea maxLength={300} onChange={(event) => setProductForm((current) => ({ ...current, descripcion: event.target.value }))} placeholder="Ej. Incluye chile asado" value={productForm.descripcion} /></label>
      </div>

      {productForm.configuracion === 'NORMAL' ? <section className="config-builder"><div className="config-builder__header"><div><strong>Presentaciones opcionales</strong><small>Ej. Media orden (4 piezas) u orden (6 piezas).</small></div><button className="button button--secondary button--compact" onClick={() => setProductForm((current) => ({ ...current, presentaciones: [...current.presentaciones, { nombre: '', cantidad_piezas: '', precio: '' }] }))} type="button"><Icon name="plus" size={15} />Agregar</button></div>{productForm.presentaciones.map((presentation, index) => <div className="config-row" key={index}><input onChange={(event) => setProductForm((current) => ({ ...current, presentaciones: current.presentaciones.map((item, itemIndex) => itemIndex === index ? { ...item, nombre: event.target.value } : item) }))} placeholder="Nombre" value={presentation.nombre} /><input min="1" onChange={(event) => setProductForm((current) => ({ ...current, presentaciones: current.presentaciones.map((item, itemIndex) => itemIndex === index ? { ...item, cantidad_piezas: event.target.value } : item) }))} placeholder="Piezas" type="number" value={presentation.cantidad_piezas} /><input min="0.01" onChange={(event) => setProductForm((current) => ({ ...current, presentaciones: current.presentaciones.map((item, itemIndex) => itemIndex === index ? { ...item, precio: event.target.value } : item) }))} placeholder="Precio" step="0.01" type="number" value={presentation.precio} /><button className="icon-button icon-button--danger" onClick={() => setProductForm((current) => ({ ...current, presentaciones: current.presentaciones.filter((_, itemIndex) => itemIndex !== index) }))} type="button"><Icon name="close" size={15} /></button></div>)}</section>
        : <section className="config-builder"><div className="config-builder__header"><div><strong>Reglas del combo</strong><small>Define cuántas elecciones incluye y las opciones disponibles.</small></div></div><div className="form-grid"><label className="form-field"><span>Elecciones incluidas</span><input min="1" onChange={(event) => setProductForm((current) => ({ ...current, cantidad_incluida: event.target.value }))} required type="number" value={productForm.cantidad_incluida} /></label><label className="form-field"><span>Máximo de elecciones</span><input min={productForm.cantidad_incluida || '1'} onChange={(event) => setProductForm((current) => ({ ...current, cantidad_maxima: event.target.value }))} required type="number" value={productForm.cantidad_maxima} /></label><label className="form-field"><span>Costo por elección adicional</span><input min="0.01" onChange={(event) => setProductForm((current) => ({ ...current, precio_seleccion_extra: event.target.value }))} required step="0.01" type="number" value={productForm.precio_seleccion_extra} /></label></div><div className="config-builder__header"><div><strong>Opciones para elegir</strong><small>Ej. Arroz frito de carnitas o brócoli con res.</small></div><button className="button button--secondary button--compact" onClick={() => setProductForm((current) => ({ ...current, opciones: [...current.opciones, ''] }))} type="button"><Icon name="plus" size={15} />Agregar</button></div>{productForm.opciones.map((option, index) => <div className="config-row config-row--option" key={index}><input onChange={(event) => setProductForm((current) => ({ ...current, opciones: current.opciones.map((item, itemIndex) => itemIndex === index ? event.target.value : item) }))} placeholder="Nombre del guisado" required value={option} /><button className="icon-button icon-button--danger" disabled={productForm.opciones.length === 1} onClick={() => setProductForm((current) => ({ ...current, opciones: current.opciones.filter((_, itemIndex) => itemIndex !== index) }))} type="button"><Icon name="close" size={15} /></button></div>)}</section>}

      <p className="form-note">El número es opcional, pero no puede repetirse en otro producto.</p>{error && <ErrorState message={error} />}<div className="form-actions"><button className="button button--secondary" onClick={() => setDialog(null)} type="button">Cancelar</button><button className="button button--primary" disabled={saving} type="submit">Guardar</button></div>
    </form></Modal>
    <Modal description="Este costo se sumará al producto cuando la mesera lo seleccione." onClose={() => setDialog(null)} open={dialog === 'extra'} size="small" title={editingExtra ? 'Editar extra' : 'Agregar extra'}><form className="stack-form" onSubmit={saveExtra}><label className="form-field"><span>Nombre</span><input autoFocus onChange={(event) => setExtraForm((current) => ({ ...current, nombre: event.target.value }))} placeholder="Ej. Pollo extra" required value={extraForm.nombre} /></label><label className="form-field"><span>Costo adicional</span><input min="0.01" onChange={(event) => setExtraForm((current) => ({ ...current, precio: event.target.value }))} required step="0.01" type="number" value={extraForm.precio} /></label>{error && <ErrorState message={error} />}<div className="form-actions"><button className="button button--secondary" onClick={() => setDialog(null)} type="button">Cancelar</button><button className="button button--primary" disabled={saving} type="submit">Guardar</button></div></form></Modal>
  </ModulePage>
}
