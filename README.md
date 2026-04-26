# Mapping & Matching Skin Lesions on TBP Images

## Table of Contents

- [Introduction](#introduction)
- [Live Deployments](#live-deployments)
- [Demo Credentials](#demo-credentials)
- [Repo Structure](#repo-structure)
- [Frontend](#frontend)
- [Backend](#backend)
- [Modeling](#modeling)

## Introduction

### Team Members  

### Students:  

- JW Aguirre
- Katelanny Diaz  
- Eugenia Nwogu 
- Sathya Padmanabhan
- Swaha Roy
- Sahitha Vuddagiri
- Ben Williams

### Project Description

Total Body Photography (TBP) is an important tool for early detection of melanoma and other skin cancers; however, manual comparison of TBP images over multiple sessions is time-consuming and error-prone. Moreover, it is difficult for patients to independently understand their own skin health.

Our project develops a system for analyzing and displaying longitudinal TBP images of patients. We aim to create a product that allows healthcare providers to efficiently track skin changes over time through automated lesion detection and an intuitive time-series display. Our product also empowers patients to take agency in managing their own health by increasing their understanding of how their skin lesions evolve over time. 

Unless specified otherwise, the user should complete all steps outlined in this README to accomplish this use case. Note, this README links to other READMEs for more detail. Not every subdirectory has a README for the sake of cleanliness/structure. 

## Live Deployments

- Frontend (Vercel): `https://lesiontracker-eight.vercel.app/`
- Backend (Cloud Run API): `https://tbp-backend-134310339623.us-central1.run.app`

## Demo Credentials

Below are credentials to login on the live deployment for demonstration.

### Deployed demo accounts 

- Doctor: `doctor` / `doctor`
- Admin: `admin` / `admin123`
- Patient with diagnosis access: `bfemalew010` / `patient1`
- Patient without diagnosis access: `wmalew090` / `patient1`

## Repo Structure
- `frontend/` contains code to run the frontend of the app
   - `app/` contains layout of the frontend page.
   - `components/` contains files of with the UI and functionality of the frontend app.
   - `public/` contains files of logos used throughout the app.
   - `test/` contains test files that verifies the functionality of the app.
- `ml/` contains code for modeling and evaluation.
   - `app/` .
   - `models/` contains files that have the weights of the models.
   - `notebooks/` contains files that have data exploration and modeling.
- `TBPBackend` contains code to run the database in the backend.
   - `TBPBackend.Api/` contains files that define how the database is stored, structured, and authentication process.
   - `TBPBackend.Tests/` contains files that test the backend functionality.
- `requirements&dependencies.md` is a file with all the dependencies needed to run each script.
- `how-to-use.md` contains step-by-step setup/run/demo instructions.
- `project_description&functionDefinition.md`
- `test_cases.md`

### Environment Setup

**Clone the repository:**
   
   ```bash
   git clone --recurse-submodules https://github.com/Katelanny/Comp413_Team3.git
   cd COMP413_TEAM3
   ```

## Frontend

This project has a frontend component. To learn more about the frontend and how to run it, click on the link below to navigate to the respective README file nested within the frontend subdirectory
- [FRONTEND README](frontend/README.md)

## Backend

This project has a backend component. To learn more about the frontend and how to run it, click on the link below to navigate to the respective README file nested within the TBPBackend subdirectory
- [BACKEND README](TBPBackend/README.md)

## Modeling

This project conducts lession detection, pose detection, and time change on lession. To learn more about the model and how to run it, click on the link below to navigate to their respective README files nested within the ml subdirectory. 

- [ML README](ml/README.md)
