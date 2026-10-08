# API REST con SQLite, Docker y CI/CD en AWS EC2

Esta es una API REST desarrollada con **Node.js**, **Express** y **SQLite**, configurada con un flujo de **Integración Continua y Despliegue Continuo (CI/CD)** utilizando **GitHub Actions**, **Docker Hub** y **AWS EC2**.

---

## 🏗️ Arquitectura del Sistema

* **Backend:** Node.js v20+ / Express v5
* **Base de Datos:** SQLite (persistida vía volumen/archivo)
* **Pruebas Automatizadas:** Jest & Supertest
* **Contenedorización:** Docker
* **CI/CD Pipeline:** GitHub Actions
* **Infraestructura:** AWS EC2 (Ubuntu Server)

---

## 🚀 Ejecución en Entorno Local

### Prerrequisitos
* Node.js (v18 o superior)
* Docker Desktop (opcional para pruebas en contenedor)

### Pasos de Instalación

1. Clonar el repositorio:
   ```bash
   git clone <https://github.com/EstefanyVillagran/api-devops-sqlite.git>
   cd api-devops-sqlite