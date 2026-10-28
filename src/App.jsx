
import { useState } from 'react'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Target,
  LayoutDashboard,
  ArrowLeftRight,
  ChartNoAxesCombined,
  Settings,
  Plus,
  Search,
  Bell,
  Coffee,
  ShoppingBag,
  BriefcaseBusiness,
  PiggyBank,
  Moon,
  Sun,
  Trash2,
  X,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import './App.css'

const initialTransactions = [
  { id: 1, title: 'Gaji bulanan', category: 'Pemasukan', date: '2026-10-25', amount: 3500000, type: 'income' },
  { id: 2, title: 'Belanja kebutuhan', category: 'Belanja', date: '2026-10-24', amount: 250000, type: 'expense' },
  { id: 3, title: 'Kopi dan makanan', category: 'Makanan', date: '2026-10-23', amount: 65000, type: 'expense' },
  { id: 4, title: 'Freelance desain', category: 'Freelance', date: '2026-10-21', amount: 500000, type: 'income' },
]

const initialGoals = [
  { id: 1, name: 'Laptop baru', target: 10000000, saved: 3500000, color: '#9b8afb' },
  { id: 2, name: 'Dana darurat', target: 5000000, saved: 2100000, color: '#43d9ad' },
  { id: 3, name: 'Liburan', target: 3000000, saved: 1200000, color: '#f7b955' },
]

const rupiah = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}


function App() {
  const [transactions, setTransactions] = useState(() =>
    readStorage('tabungin-transactions', []),
  )

  const [goals, setGoals] = useState(() =>
    readStorage('tabungin-goals', []),
  )

  const [dark, setDark] = useState(() =>
    readStorage('tabungin-dark', true),
  )
  const [page, setPage] = useState('Dashboard')
  const [search, setSearch] = useState('')
  const [showTransaction, setShowTransaction] = useState(false)
  const [showGoal, setShowGoal] = useState(false)
  const [notice, setNotice] = useState('')

  const saveTransactions = (next) => {
    setTransactions(next)
    localStorage.setItem('tabungin-transactions', JSON.stringify(next))
  }

  const saveGoals = (next) => {
    setGoals(next)
    localStorage.setItem('tabungin-goals', JSON.stringify(next))
  }

  const saveDark = (next) => {
    setDark(next)
    localStorage.setItem('tabungin-dark', JSON.stringify(next))
  }

  const income = transactions
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + Number(item.amount), 0)

  const expense = transactions
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + Number(item.amount), 0)

  const balance = income - expense
  const totalSaved = goals.reduce((sum, goal) => sum + Number(goal.saved), 0)

  const filteredTransactions = transactions.filter((item) =>
    `${item.title} ${item.category}`.toLowerCase().includes(search.toLowerCase()),
  )

  const addTransaction = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const amount = Number(form.get('amount'))
    if (!amount || amount <= 0) return

    const next = [
      {
        id: Date.now(),
        title: form.get('title'),
        category: form.get('category'),
        date: form.get('date'),
        amount,
        type: form.get('type'),
      },
      ...transactions,
    ]
    saveTransactions(next)
    setShowTransaction(false)
    setNotice('Transaksi berhasil ditambahkan.')
    event.currentTarget.reset()
  }

  const addGoal = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const target = Number(form.get('target'))
    if (!target || target <= 0) return

    saveGoals([
      ...goals,
      {
        id: Date.now(),
        name: form.get('name'),
        target,
        saved: 0,
        color: ['#9b8afb', '#43d9ad', '#f7b955', '#6ab8ff'][goals.length % 4],
      },
    ])
    setShowGoal(false)
    setNotice('Target tabungan berhasil dibuat.')
  }

  const deleteTransaction = (id) => {
    saveTransactions(transactions.filter((item) => item.id !== id))
    setNotice('Transaksi dihapus.')
  }
  


const deleteGoal = (id) => {
  const goal = goals.find((item) => item.id === id)
  if (!goal) return

  const confirmed = window.confirm(
    `Hapus target "${goal.name}"? Dana yang dialokasikan sebesar ${rupiah(goal.saved)} akan dikembalikan ke saldo bersih.`
  )

  if (!confirmed) return

  // Cari transaksi alokasi dana untuk target ini
  const allocationTitle = `Tabungan: ${goal.name}`

  // Hapus transaksi alokasi yang terkait dengan target ini,
  // bukan mencatat pengembalian sebagai pemasukan baru.
  const updatedTransactions = transactions.filter(
    (item) => item.title !== allocationTitle
  )

  // Hapus target tabungan
  saveGoals(goals.filter((item) => item.id !== id))

  // Perbarui riwayat transaksi
  if (updatedTransactions.length !== transactions.length) {
    saveTransactions(updatedTransactions)
  }

  setNotice(
    `Target "${goal.name}" dihapus. Alokasi tabungannya dibatalkan dan saldo bersih dihitung ulang.`
  )
}

const contribute = (goal) => {
  const remaining = Math.max(0, goal.target - goal.saved)

  if (remaining <= 0) {
    setNotice('Target tabungan ini sudah tercapai.')
    return
  }

  const raw = window.prompt(
    `Masukkan nominal untuk ${goal.name} (Rp). Sisa target: Rp${remaining.toLocaleString('id-ID')}`,
    String(Math.min(100000, remaining))
  )

  if (raw === null) return

  const amount = Number(raw)

  if (!Number.isFinite(amount) || amount <= 0) {
    setNotice('Masukkan nominal yang valid.')
    return
  }

  if (amount > Math.max(0, balance)) {
    setNotice('Saldo pemasukan dikurangi pengeluaran tidak mencukupi.')
    return
  }

  if (amount > remaining) {
    setNotice(`Nominal melebihi sisa target Rp${remaining.toLocaleString('id-ID')}.`)
    return
  }

  saveGoals(
    goals.map((item) =>
      item.id === goal.id
        ? { ...item, saved: item.saved + amount }
        : item
    )
  )

  saveTransactions([
    {
      id: Date.now(),
      title: `Tabungan: ${goal.name}`,
      category: 'Tabungan',
      date: new Date().toISOString().slice(0, 10),
      amount,
      type: 'expense',
    },
    ...transactions,
  ])

  setNotice('Dana berhasil dialokasikan ke tabungan.')
}

  const exportData = () => {
    const blob = new Blob(
      [JSON.stringify({ transactions, goals }, null, 2)],
      { type: 'application/json' },
    )
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'tabungin-backup.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportCSV = () => {
    const rows = [
      ['Tanggal', 'Nama', 'Kategori', 'Jenis', 'Nominal'],
      ...transactions.map((item) => [
        item.date, item.title, item.category,
        item.type === 'income' ? 'Pemasukan' : 'Pengeluaran', item.amount,
      ]),
    ]
    const csv = rows.map((row) =>
      row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')
    ).join('\n')
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'laporan-tabungin.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard },
    { label: 'Transaksi', icon: ArrowLeftRight },
    { label: 'Tabungan', icon: Target },
    { label: 'Laporan', icon: ChartNoAxesCombined },
    { label: 'Pengaturan', icon: Settings },
  ]

  const maxChart = Math.max(1, ...transactions.map((item) => Number(item.amount)))

  return (
    <div className={`app-shell ${dark ? 'dark' : 'light'}`}>
      <aside className="sidebar">
        <a className="brand" href="#" onClick={(e) => { e.preventDefault(); setPage('Dashboard') }}>
          <span className="brand-icon"><PiggyBank size={25} /></span>
          <span>Tabung<span className="brand-accent">IN</span><small>PERSONAL FINANCE</small></span>
        </a>

        <div className="nav-caption">MENU UTAMA</div>
        <nav className="side-nav">
          {navItems.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${page === label ? 'active' : ''}`} onClick={() => setPage(label)}>
              <Icon size={18} /><span>{label}</span>
              {label === 'Transaksi' && <span className="nav-count">{transactions.length}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="mini-goal">
            <div className="mini-goal-icon"><Target size={19} /></div>
            <strong>Terus menabung!</strong>
            <p>Langkah kecil hari ini, masa depan lebih baik.</p>
            <button onClick={() => { setPage('Tabungan'); setShowGoal(true) }}>+ Buat target</button>
          </div>
          <div className="profile">
            <div className="avatar">T</div>
            <div><strong>Pengguna TabungIN</strong><small>Keuangan pribadi</small></div>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <div className="eyebrow">KEUANGAN PRIBADI / {page.toUpperCase()}</div>
            <h1>{page === 'Dashboard' ? 'Dashboard' : page}</h1>
          </div>
          <div className="top-actions">
            <label className="search-box"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari transaksi..." /></label>
            <button className="icon-button" title="Ganti tema" onClick={() => saveDark(!dark)}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
            <button className="icon-button notification" title="Notifikasi" onClick={() => setNotice('Tidak ada notifikasi baru.')}><Bell size={18} /></button>
            <div className="avatar top-avatar">T</div>
          </div>
        </header>

        {notice && <div className="notice">{notice}<button onClick={() => setNotice('')}><X size={15} /></button></div>}

        {page === 'Dashboard' && (
          <>
            <section className="welcome-row">
              <div><h2>Halo, selamat datang! <span>✦</span></h2><p>Ini ringkasan kondisi keuanganmu saat ini.</p></div>
              <button className="primary-button" onClick={() => setShowTransaction(true)}><Plus size={18} /> Tambah transaksi</button>
            </section>
            <section className="stats-grid">
              <article className="stat-card balance-card">
                <div className="stat-top"><span>Total saldo bersih</span><span className="stat-icon purple"><Wallet size={19} /></span></div>
                <div className="stat-value balance-value">
  {rupiah(balance)}
</div>
                <div className="stat-foot"><span className="positive"><TrendingUp size={14} /> Ringkasan transaksi</span><span className="muted">Semua data</span></div>
                <div className="balance-decoration">Rp</div>
              </article>
              <article className="stat-card">
                <div className="stat-top"><span>Total pemasukan</span><span className="stat-icon green"><TrendingUp size={19} /></span></div>
                <div className="stat-value">{rupiah(income)}</div>
                <div className="stat-foot"><span className="positive">↗ Uang masuk</span><span className="muted">{transactions.filter((t) => t.type === 'income').length} transaksi</span></div>
              </article>
              <article className="stat-card">
                <div className="stat-top"><span>Total pengeluaran</span><span className="stat-icon orange"><TrendingDown size={19} /></span></div>
                <div className="stat-value">{rupiah(expense)}</div>
                <div className="stat-foot"><span className="negative">↘ Uang keluar</span><span className="muted">{transactions.filter((t) => t.type === 'expense').length} transaksi</span></div>
              </article>
              <article className="stat-card">
                <div className="stat-top"><span>Total tabungan</span><span className="stat-icon blue"><PiggyBank size={19} /></span></div>
                <div className="stat-value">{rupiah(totalSaved)}</div>
                <div className="stat-foot"><span className="positive">Target berjalan</span><span className="muted">{goals.length} target</span></div>
              </article>
            </section>

            <section className="content-grid">
              <article className="panel chart-panel">
                <div className="panel-heading"><div><h3>Aktivitas transaksi</h3><p>Perbandingan nominal transaksi</p></div><span className="pill">Semua transaksi</span></div>
                <div className="bar-chart">
                  {transactions.slice(0, 7).reverse().map((item) => (
                    <div className="bar-column" key={item.id}>
                      <span className="bar-value">{Math.round(item.amount / 1000)}k</span>
                      <div className="bar-track"><div className={`bar ${item.type}`} style={{ height: `${Math.max(5, item.amount / maxChart * 100)}%` }} /></div>
                      <span className="bar-label">{item.title.length > 10 ? item.title.slice(0, 10) + '…' : item.title}</span>
                    </div>
                  ))}
                </div>
                <div className="chart-legend"><span><i className="legend-dot income-dot" /> Pemasukan</span><span><i className="legend-dot expense-dot" /> Pengeluaran</span></div>
              </article>

              <article className="panel goals-panel">
                <div className="panel-heading"><div><h3>Target tabungan</h3><p>Wujudkan rencana finansialmu</p></div><button className="text-button" onClick={() => { setPage('Tabungan'); setShowGoal(true) }}>+ Tambah</button></div>
                {goals.slice(0, 3).map((goal) => {
                  const percent = Math.min(100, Math.round(goal.saved / goal.target * 100))
                  return <div className="goal-item" key={goal.id}><div className="goal-line"><span className="goal-dot" style={{ background: goal.color }} /><strong>{goal.name}</strong><span>{percent}%</span></div><div className="progress-track"><div className="progress-fill" style={{ width: `${percent}%`, background: goal.color }} /></div><div className="goal-amount"><span>{rupiah(goal.saved)}</span><span>dari {rupiah(goal.target)}</span></div><button className="contribute-button" onClick={() => contribute(goal)}>+ Tambah dana</button></div>
                })}
                {goals.length === 0 && <p className="empty-state">Belum ada target tabungan.</p>}
              </article>
            </section>

            <TransactionTable transactions={filteredTransactions.slice(0, 5)} onDelete={deleteTransaction} onViewAll={() => setPage('Transaksi')} />
          </>
        )}

        {page === 'Transaksi' && (
          <section className="page-panel">
            <div className="section-title-row"><div><h2>Semua transaksi</h2><p>Catat dan kelola uang masuk maupun keluar.</p></div><button className="primary-button" onClick={() => setShowTransaction(true)}><Plus size={17} /> Tambah transaksi</button></div>
            <TransactionTable transactions={filteredTransactions} onDelete={deleteTransaction} />
          </section>
        )}

        {page === 'Tabungan' && (
          <section className="page-panel">
            <div className="section-title-row"><div><h2>Target tabungan</h2><p>Atur tujuan dan pantau progres tabunganmu.</p></div><button className="primary-button" onClick={() => setShowGoal(true)}><Plus size={17} /> Buat target</button></div>
            <div className="goal-cards">
              {goals.map((goal) => {
                const percent = Math.min(100, Math.round(goal.saved / goal.target * 100))
                return <article className="panel goal-large" key={goal.id}><div className="goal-large-icon" style={{ color: goal.color, background: `${goal.color}20` }}><Target size={23} /></div><h3>{goal.name}</h3><p>Target tabungan</p><div className="goal-large-value">{rupiah(goal.saved)} <small>/ {rupiah(goal.target)}</small></div><div className="progress-track"><div className="progress-fill" style={{ width: `${percent}%`, background: goal.color }} /></div><div className="goal-large-foot"><span>{percent}% tercapai</span><span>Sisa {rupiah(Math.max(0, goal.target - goal.saved))}</span></div>
<div className="goal-card-actions">
  <button
    className="primary-button"
    onClick={() => contribute(goal)}
  >
    + Tambah dana
  </button>

  <button
    className="danger-button"
    onClick={() => deleteGoal(goal.id)}
    title={`Hapus target ${goal.name}`}
    aria-label={`Hapus target ${goal.name}`}
  >
    <Trash2 size={16} />
    Hapus
  </button>
</div>
</article>
              })}
            </div>
          </section>
        )}

        {page === 'Laporan' && (
          <section className="page-panel">
            <div className="section-title-row"><div><h2>Laporan keuangan</h2><p>Ringkasan dari seluruh transaksi yang tersimpan.</p></div><div className="report-actions"><button className="secondary-button" onClick={exportCSV}>Ekspor CSV</button><button className="primary-button" onClick={exportData}>Backup JSON</button></div></div>
            <div className="stats-grid report-stats"><article className="stat-card"><div className="stat-top">Pemasukan</div><div className="stat-value positive">{rupiah(income)}</div></article><article className="stat-card"><div className="stat-top">Pengeluaran</div><div className="stat-value negative">{rupiah(expense)}</div></article><article className="stat-card"><div className="stat-top">Saldo bersih</div><div className="stat-value">{rupiah(balance)}</div></article></div>
            <div className="panel report-panel">
  <h3>Ringkasan kategori</h3>

  {(() => {
    const categories = [
      ...new Set(transactions.map((item) => item.category || 'Lainnya')),
    ]

    const colors = [
      '#8b6cf6',
      '#36c9a7',
      '#f6b756',
      '#ef6b82',
      '#55a6f7',
      '#c084fc',
      '#fb923c',
      '#6ee7b7',
      '#f472b6',
      '#a3a3a3',
    ]

    const incomeCategories = categories.map((category) => ({
      category,
      total: transactions
        .filter(
          (item) =>
            (item.category || 'Lainnya') === category &&
            item.type === 'income'
        )
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    }))

    const expenseCategories = categories.map((category) => ({
      category,
      total: transactions
        .filter(
          (item) =>
            (item.category || 'Lainnya') === category &&
            item.type === 'expense'
        )
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    }))

    const chartData = [
      ...incomeCategories
        .filter((item) => item.total > 0)
        .map((item) => ({
          name: `Pemasukan - ${item.category}`,
          value: item.total,
        })),
      ...expenseCategories
        .filter((item) => item.total > 0)
        .map((item) => ({
          name: `Pengeluaran - ${item.category}`,
          value: item.total,
        })),
    ]

    const renderRows = (items) =>
      items.map((item) => (
        <div className="report-row" key={item.category}>
          <span>{item.category}</span>
          <div className="report-track">
            <div
              style={{
                width: `${
                  item.total > 0
                    ? Math.max(
                        1,
                        Math.min(
                          100,
                          (item.total /
                            Math.max(1, ...items.map((entry) => entry.total))) *
                            100
                        )
                      )
                    : 0
                }%`,
              }}
            />
          </div>
          <strong>{rupiah(item.total)}</strong>
        </div>
      ))

    return (
      <>
        <h4>Pemasukan</h4>
        {renderRows(incomeCategories)}

        <h4 style={{ marginTop: 24 }}>Pengeluaran</h4>
        {renderRows(expenseCategories)}

        <div className="report-chart">
          <h4>Grafik lingkaran kategori</h4>

          {chartData.length > 0 ? (
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={65}
                    outerRadius={105}
                    paddingAngle={2}
                  >
                    {chartData.map((item, index) => (
                      <Cell
                        key={item.name}
                        fill={colors[index % colors.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value) => rupiah(Number(value))}
                    contentStyle={{
                      background: '#201e2b',
                      border: '1px solid #393449',
                      borderRadius: 10,
                      color: '#fff',
                    }}
                  />

                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="muted">
              Belum ada transaksi untuk ditampilkan pada grafik.
            </p>
          )}
        </div>
      </>
    )
  })()}
</div>
</section>
        )}

        {page === 'Pengaturan' && (
          <section className="page-panel">
            <div className="section-title-row"><div><h2>Pengaturan</h2><p>Atur tampilan dan cadangan data TabungIN.</p></div></div>
            <div className="panel settings-panel"><div className="setting-row"><div><strong>Tampilan aplikasi</strong><p>Gunakan tema gelap atau terang.</p></div><button className="secondary-button" onClick={() => saveDark(!dark)}>{dark ? <Sun size={16} /> : <Moon size={16} />} Ganti tema</button></div><div className="setting-row"><div><strong>Ekspor cadangan</strong><p>Simpan data transaksi dan target dalam file JSON.</p></div><button className="primary-button" onClick={exportData}>Unduh backup</button></div><div className="setting-row"><div><strong>Ekspor laporan</strong><p>Unduh daftar transaksi sebagai file CSV.</p></div><button className="secondary-button" onClick={exportCSV}>Unduh CSV</button></div><div className="setting-row"><div><strong>Hapus semua data</strong><p>Hapus transaksi dan target yang tersimpan di browser ini.</p></div><button className="danger-button" onClick={() => { if (window.confirm('Yakin ingin menghapus seluruh data TabungIN?')) { saveTransactions([]); saveGoals([]); setNotice('Seluruh data telah dihapus.') } }}>Hapus data</button></div></div>
          </section>
        )}

        <footer className="footer"><span>© 2026 TabungIN</span><span>Kelola uang, raih impian.</span></footer>
      </main>

      {showTransaction && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowTransaction(false) }}><form className="modal" onSubmit={addTransaction}><div className="modal-heading"><div><h2>Tambah transaksi</h2><p>Masukkan detail transaksi barumu.</p></div><button type="button" className="icon-button" onClick={() => setShowTransaction(false)}><X size={19} /></button></div><label>Nama transaksi<input name="title" required placeholder="Contoh: Belanja bulanan" /></label><div className="form-row"><label>Jenis<select name="type"><option value="expense">Pengeluaran</option><option value="income">Pemasukan</option></select></label><label>Kategori<select name="category"><option>Belanja</option><option>Makanan</option><option>Transportasi</option><option>Tagihan</option><option>Gaji</option><option>Freelance</option><option>Tabungan</option><option>Lainnya</option></select></label></div><label>Nominal (Rp)<input name="amount" type="number" min="1" required placeholder="100000" /></label><label>Tanggal<input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></label><button className="primary-button full-button" type="submit">Simpan transaksi</button></form></div>}

      {showGoal && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowGoal(false) }}><form className="modal" onSubmit={addGoal}><div className="modal-heading"><div><h2>Buat target tabungan</h2><p>Tentukan impian dan nominal targetmu.</p></div><button type="button" className="icon-button" onClick={() => setShowGoal(false)}><X size={19} /></button></div><label>Nama target<input name="name" required placeholder="Contoh: Laptop baru" /></label><label>Nominal target (Rp)<input name="target" type="number" min="1" required placeholder="5000000" /></label><button className="primary-button full-button" type="submit">Buat target</button></form></div>}
    </div>
  )
}

function TransactionTable({ transactions, onDelete, onViewAll }) {
  const iconFor = (item) => {
    if (item.type === 'income') return <BriefcaseBusiness size={18} />
    if (item.category === 'Makanan') return <Coffee size={18} />
    return <ShoppingBag size={18} />
  }

  return (
    <section className="panel transactions-panel">
      <div className="panel-heading"><div><h3>Transaksi terbaru</h3><p>Catatan aktivitas keuanganmu</p></div>{onViewAll && <button className="text-button" onClick={onViewAll}>Lihat semua →</button>}</div>
      {transactions.length === 0 ? <p className="empty-state">Belum ada transaksi yang cocok.</p> : <div className="table-scroll"><table><thead><tr><th>Transaksi</th><th>Kategori</th><th>Tanggal</th><th>Nominal</th><th>Aksi</th></tr></thead><tbody>{transactions.map((item) => <tr key={item.id}><td><div className="transaction-name"><span className={`transaction-icon ${item.type}`}>{iconFor(item)}</span><strong>{item.title}</strong></div></td><td><span className="category-pill">{item.category}</span></td><td>{item.date}</td><td className={item.type === 'income' ? 'positive' : 'negative'}>{item.type === 'income' ? '+' : '−'}{rupiah(item.amount)}</td><td><button className="delete-button" title="Hapus transaksi" onClick={() => onDelete(item.id)}><Trash2 size={16} /></button></td></tr>)}</tbody></table></div>}
    </section>
  )
}

export default App