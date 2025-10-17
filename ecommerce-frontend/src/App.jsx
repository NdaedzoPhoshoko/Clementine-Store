
import './App.css'
import Navbar from './components/nabar/Navbar'
import Footer from './components/footer/Footer'

function App() {

  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-content">
        {/* Page content will render here */}
      </main>
      <Footer />
    </div>
  )
}

export default App
