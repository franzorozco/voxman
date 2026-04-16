import React from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/global/logo_black.png";
import modelo1 from "../../assets/global/modelo_1.png";
import modelo2 from "../../assets/global/modelo_2.png";
import modelo3 from "../../assets/global/modelo_3.png";
import modelo4 from "../../assets/global/modelo_4.png";
import fondoDestacados from "../../assets/global/fondos/fondo_grafito.png";
export default function Home() {
  return (
    <div className="home">

      {/* HEADER */}
      <header className="header">
        <div className="container header-content">
          <div className="logo">
            <img src={logo} alt="VOXman" />
          </div>

          <nav className="nav">
            <Link to="/">Inicio</Link>
            <Link to="/shop">Tienda</Link>
            <Link to="/login">Login</Link>
            <Link to="/register">Registro</Link>
          </nav>
        </div>
      </header>

      {/* MAIN */}
      <main>

        {/* HERO */}
        <section className="hero">

          {/* FONDO DIVIDIDO */}
          <div className="hero-split">
            <div className="hero-col" style={{ backgroundImage: `url(${modelo1})` }}></div>
            <div className="hero-col" style={{ backgroundImage: `url(${modelo2})` }}></div>
            <div className="hero-col" style={{ backgroundImage: `url(${modelo3})` }}></div>
            <div className="hero-col" style={{ backgroundImage: `url(${modelo4})` }}></div>
          </div>

          {/* CONTENIDO ENCIMA */}
          <div className="hero-content container">
            <h1>VOXman</h1>
            <p>Estilo masculino moderno, minimalista y potente.</p>

            <div className="hero-buttons">
              <Link to="/shop" className="btn primary">
                Explorar tienda
              </Link>
              <Link to="/register" className="btn secondary">
                Crear cuenta
              </Link>
            </div>
          </div>

        </section>

        {/* CATEGORÍAS */}
        <section className="section">
          <div className="container">
            <h2>Categorías</h2>

            <div className="grid">
              <div className="card">Camisetas</div>
              <div className="card">Pantalones</div>
              <div className="card">Chaquetas</div>
              <div className="card">Accesorios</div>
            </div>
          </div>
        </section>

        {/* DESTACADOS */}
        <section className="section destacados">
          <div className="container">
            <h2>Destacados</h2>

            <div className="grid">
              <div className="product">
                <div className="img"></div>
                <p>Oversize Black Tee</p>
                <span>$29.99</span>
              </div>

              <div className="product">
                <div className="img"></div>
                <p>Urban Jacket</p>
                <span>$59.99</span>
              </div>

              <div className="product">
                <div className="img"></div>
                <p>Classic Jeans</p>
                <span>$39.99</span>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <p>© {new Date().getFullYear()} VOXman. Todos los derechos reservados.</p>
        </div>
      </footer>

<style>{`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: Arial, sans-serif;
  }

  .home {
    width: 100%;
    min-height: 100vh;
    background: #0d0d0d;
    color: #fff;
  }

  /* CONTAINER */
  .container {
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }

  /* HEADER */
  .header {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 70px;
    background: #000;
    border-bottom: 1px solid #333;
    z-index: 1000;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 100%;
    padding: 0 60px;
  }

  .logo {
    display: flex;
    align-items: center;
  }

  .logo img {
    height: 40px;
    width: auto;
    object-fit: contain;
  }

  .nav a {
    margin-left: 25px;
    text-decoration: none;
    color: #fff;
    font-weight: 500;
    transition: 0.3s;
  }

  .nav a:hover {
    color: #c9a227;
  }

  /* HERO (CORREGIDO 🔥) */
  .hero {
    position: relative;
    height: 100vh;
    margin-top: 70px; /* correcto con header */
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .hero-content {
    position: relative;
    z-index: 2;
    text-align: center;
  }

  .hero h1 {
    font-size: 64px;
    letter-spacing: 3px;
  }

  .hero p {
    margin-top: 15px;
    font-size: 18px;
    color: #aaa;
  }

  .hero-buttons {
    margin-top: 30px;
  }

  /* FONDO HERO */
  .hero-split {
    position: absolute;
    inset: 0;
    display: flex;
  }

  .hero-col {
    flex: 1;
    background-size: cover;
    background-position: center;
    transition: 0.4s;
  }

  /* 🔥 DIVISIÓN INCLINADA */
  .hero-col:nth-child(1) {
    clip-path: polygon(0 0, 100% 0, 85% 100%, 0% 100%);
  }

  .hero-col:nth-child(2),
  .hero-col:nth-child(3) {
    clip-path: polygon(15% 0, 100% 0, 85% 100%, 0% 100%);
  }

  .hero-col:nth-child(4) {
    clip-path: polygon(15% 0, 100% 0, 100% 100%, 0% 100%);
  }

  /* OVERLAY */
  .hero::after {
    content: "";
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 1;
  }

  /* BOTONES */
  .btn {
    padding: 12px 24px;
    margin: 0 10px;
    border: 1px solid transparent;
    text-decoration: none;
    font-weight: bold;
    transition: 0.3s;
    display: inline-block;
  }

  .primary {
    background: #c9a227;
    color: #000;
  }

  .primary:hover {
    background: #fff;
  }

  .secondary {
    border: 1px solid #fff;
    color: #fff;
  }

  .secondary:hover {
    background: #fff;
    color: #000;
  }

  /* SECCIONES */
  .section {
    padding: 80px 60px;
    text-align: center;
  }

  .section h2 {
    font-size: 32px;
    margin-bottom: 40px;
  }

  .darker {
    background: #111;
  }

  /* GRID */
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
  }

  .card {
    padding: 40px;
    border: 1px solid #333;
    background: #1a1a1a;
    transition: 0.3s;
  }

  .card:hover {
    border-color: #c9a227;
    transform: translateY(-5px);
  }

  /* PRODUCTOS */
  .product {
    background: #000;
    padding: 20px;
    border: 1px solid #333;
    transition: 0.3s;
  }

  .product:hover {
    border-color: #c9a227;
  }

  .product .img {
    height: 180px;
    background: #222;
    margin-bottom: 15px;
  }

  .product span {
    color: #c9a227;
    font-weight: bold;
  }

  /* FOOTER */
  .footer {
    padding: 30px;
    text-align: center;
    border-top: 1px solid #333;
  }

  /* RESPONSIVE */
  @media (max-width: 768px) {

    .header-content {
      padding: 0 20px;
    }

    .hero h1 {
      font-size: 40px;
    }

    .section {
      padding: 50px 20px;
    }

    /* 🔥 HERO 2x2 */
    .hero {
      height: auto;
      min-height: 100vh;
    }

    .hero-split {
      position: absolute;
      inset: 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;   
    }

    .hero-col {
      width: 100%;
      height: 100%;
      clip-path: none;
    }

    /* overlay */
    .hero::after {
      background: rgba(0,0,0,0.4);
    }

    /* contenido encima */
    .hero-content {
      position: relative;
      z-index: 2;
      padding: 0 20px;
    }

    .hero-col:nth-child(1) {
      clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%);
    }

    .hero-col:nth-child(2) {
      clip-path: polygon(0% 0, 100% 0, 100% 100%, 0% 100%);
    }

    .hero-col:nth-child(3) {
      clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%);
    }

    .hero-col:nth-child(4) {
      clip-path: polygon(0% 0, 100% 0, 100% 100%, 0% 100%);
    }
  }


  .destacados {
  position: relative;
  background-image: url(${fondoDestacados});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  z-index: 1;
}

/* overlay oscuro para que se lea bien */
.destacados::before {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1;
}

/* contenido encima */
.destacados .container {
  position: relative;
  z-index: 2;
}



}
`}</style>
    </div>
  );
}