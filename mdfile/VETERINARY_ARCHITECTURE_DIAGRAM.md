# 🏗️ Veterinary Module - Architecture & Data Flow

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         VETERINARY MODULE                            │
│                    Professional Medical Tracking                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          FRONTEND LAYER                              │
├─────────────────────────────┬───────────────────────────────────────┤
│     MANAGER SIDE            │          USER SIDE                    │
├─────────────────────────────┼───────────────────────────────────────┤
│                             │                                       │
│  ┌─────────────────────┐   │   ┌──────────────────────────┐       │
│  │ Comprehensive       │   │   │ User Pets Medical        │       │
│  │ Medical Records     │   │   │ History Dashboard        │       │
│  │ Dashboard           │   │   │ (All Pets)               │       │
│  │                     │   │   │                          │       │
│  │ • Search & Filter   │   │   │ • Pet Cards Grid         │       │
│  │ • Statistics        │   │   │ • Medical Stats          │       │
│  │ • Payment Tracking  │   │   │ • Quick Actions          │       │
│  │ • Export            │   │   │ • Health Alerts          │       │
│  └─────────────────────┘   │   └──────────────────────────┘       │
│            │                │              │                        │
│            │                │              │                        │
│  ┌─────────────────────┐   │   ┌──────────────────────────┐       │
│  │ Pet Medical         │   │   │ User Pet Medical         │       │
│  │ Timeline            │   │   │ History Detail           │       │
│  │ (Manager View)      │   │   │ (Pet Owner View)         │       │
│  │                     │   │   │                          │       │
│  │ • Visual Timeline   │   │   │ • Timeline               │       │
│  │ • Health Stats      │   │   │ • Current Medications    │       │
│  │ • Medications       │   │   │ • Vaccinations           │       │
│  │ • Vaccinations      │   │   │ • Financial Summary      │       │
│  │ • Diagnoses         │   │   │ • Download Records       │       │
│  └─────────────────────┘   │   └──────────────────────────┘       │
│                             │                                       │
└─────────────────────────────┴───────────────────────────────────────┘
                              │
                              │ API Calls
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API SERVICES LAYER                           │
│                     (frontend/src/services/api.js)                   │
├──────────────────────────────┬──────────────────────────────────────┤
│     MANAGER API              │         USER API                     │
├──────────────────────────────┼──────────────────────────────────────┤
│                              │                                      │
│ • managerGetMedicalHistory   │ • userGetPetsMedicalHistory()       │
│   Dashboard()                │                                      │
│                              │ • userGetPetMedicalHistory(petId)   │
│ • managerSearchMedical       │                                      │
│   Records(params)            │ • userGetMedicalRecordDetail        │
│                              │   (recordId)                         │
│ • managerGetPetMedical       │                                      │
│   History(petId)             │ • userDownloadMedicalRecord         │
│                              │   (recordId)                         │
│ • managerGetDetailed         │                                      │
│   MedicalRecord(recordId)    │                                      │
│                              │                                      │
│ • managerExportMedical       │                                      │
│   Records(params)            │                                      │
│                              │                                      │
└──────────────────────────────┴──────────────────────────────────────┘
                              │
                              │ HTTP Requests
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          BACKEND ROUTES                              │
│              (backend/modules/veterinary/routes/)                    │
├──────────────────────────────┬──────────────────────────────────────┤
│     MANAGER ROUTES           │         USER ROUTES                  │
├──────────────────────────────┼──────────────────────────────────────┤
│                              │                                      │
│ GET /manager/medical-        │ GET /user/medical-history/pets      │
│     history/pet/:petId       │                                      │
│                              │ GET /user/medical-history/           │
│ GET /manager/medical-        │     pet/:petId                       │
│     history/record/:id       │                                      │
│                              │ GET /user/medical-history/           │
│ GET /manager/medical-        │     record/:recordId                 │
│     history/search           │                                      │
│                              │ GET /user/medical-history/           │
│ GET /manager/medical-        │     record/:recordId/download        │
│     history/dashboard/stats  │                                      │
│                              │                                      │
│ GET /manager/medical-        │                                      │
│     history/export           │                                      │
│                              │                                      │
└──────────────────────────────┴──────────────────────────────────────┘
                              │
                              │ Controller Functions
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         CONTROLLERS LAYER                            │
│          (backend/modules/veterinary/*/controllers/)                 │
├──────────────────────────────┬──────────────────────────────────────┤
│  medicalHistoryController.js │  medicalHistoryUserController.js    │
│  (Manager)                   │  (User)                              │
├──────────────────────────────┼──────────────────────────────────────┤
│                              │                                      │
│ • getPetMedicalHistory()     │ • getUserPetsMedicalHistory()       │
│                              │                                      │
│ • getDetailedMedicalRecord() │ • getUserPetMedicalHistory()        │
│                              │                                      │
│ • searchMedicalRecords()     │ • getUserMedicalRecordDetail()      │
│                              │                                      │
│ • getMedicalRecords          │ • downloadMedicalRecord()           │
│   Dashboard()                │                                      │
│                              │                                      │
│ • exportMedicalRecords()     │                                      │
│                              │                                      │
│ ──────────────────────────── │ ──────────────────────────────────  │
│                              │                                      │
│ Business Logic:              │ Business Logic:                      │
│ • Authorization checks       │ • Ownership verification             │
│ • Data aggregation           │ • Pet identification                 │
│ • Statistics calculation     │ • Timeline building                  │
│ • Search & filtering         │ • Financial calculations             │
│ • Export formatting          │ • Download formatting                │
│                              │                                      │
└──────────────────────────────┴──────────────────────────────────────┘
                              │
                              │ Database Queries
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DATABASE MODELS LAYER                           │
│              (backend/modules/veterinary/models/)                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │    VeterinaryMedicalRecord Model                         │      │
│  │    ────────────────────────────────────────────          │      │
│  │    • pet (ref: Pet)                                      │      │
│  │    • owner (ref: User)                                   │      │
│  │    • veterinary (ref: Veterinary)                        │      │
│  │    • staff (ref: User)                                   │      │
│  │    • visitDate                                           │      │
│  │    • diagnosis, treatment, notes                         │      │
│  │    • medications []                                      │      │
│  │    • procedures []                                       │      │
│  │    • vaccinations []                                     │      │
│  │    • tests []                                            │      │
│  │    • prescriptions []                                    │      │
│  │    • attachments []                                      │      │
│  │    • totalCost, amountPaid, paymentStatus               │      │
│  │    • followUpRequired, followUpDate, followUpNotes      │      │
│  │    • Indexes on: pet, owner, veterinary, visitDate      │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │    VeterinaryVaccinationSchedule Model                   │      │
│  │    ────────────────────────────────────────────          │      │
│  │    • pet, vaccineName, scheduledDate                     │      │
│  │    • status, nextDueDate, batchNumber                    │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │    VeterinaryAppointment Model                           │      │
│  │    ────────────────────────────────────────────          │      │
│  │    • petId, ownerId, appointmentDate, status             │      │
│  │    • reason, visitType, serviceId                        │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │    Pet Model (Core)                                      │      │
│  │    ────────────────────────────────────────────          │      │
│  │    • name, species, breed, age, gender, weight           │      │
│  │    • owner, images, microchipId                          │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │    Veterinary Model                                      │      │
│  │    ────────────────────────────────────────────          │      │
│  │    • name, location, storeId                             │      │
│  │    • contact information                                 │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Flow 1: Manager Viewing Medical Records

```
┌──────────┐
│ Manager  │
│ Opens    │
│ Medical  │
│ Records  │
└────┬─────┘
     │
     ▼
┌──────────────────────────────┐
│ ComprehensiveMedicalRecords  │
│ Component Loads               │
└────┬─────────────────────────┘
     │
     ├──► Load Dashboard Stats
     │    │
     │    ▼
     │    API: managerGetMedicalHistoryDashboard()
     │    │
     │    ▼
     │    Controller: getMedicalRecordsDashboard()
     │    │
     │    ▼
     │    Query: Aggregate statistics
     │    │
     │    ▼
     │    Return: Overview, payment stats, common diagnoses
     │
     └──► Load Medical Records
          │
          ▼
          API: managerSearchMedicalRecords(params)
          │
          ▼
          Controller: searchMedicalRecords()
          │
          ▼
          Query: Find records with filters, populate relations
          │
          ▼
          Return: Paginated records with pet, owner, staff info
```

### Flow 2: User Viewing Pet Medical History

```
┌──────────┐
│  User    │
│  Clicks  │
│  Pet     │
└────┬─────┘
     │
     ▼
┌────────────────────────────────┐
│ UserPetMedicalHistoryDetail    │
│ Component Loads                 │
└────┬───────────────────────────┘
     │
     ▼
     API: userGetPetMedicalHistory(petId)
     │
     ▼
     Controller: getUserPetMedicalHistory()
     │
     ├──► Verify Pet Ownership
     │    │
     │    ▼
     │    Find pet across all models (Pet, AdoptionPet)
     │    │
     │    ▼
     │    Check if user owns the pet
     │    │
     │    ▼
     │    If not owned → Return 403 Error
     │
     ├──► Fetch Medical Records
     │    │
     │    ▼
     │    Query: VeterinaryMedicalRecord.find({ pet, owner })
     │    │
     │    ▼
     │    Populate: veterinary, staff
     │
     ├──► Fetch Vaccinations
     │    │
     │    ▼
     │    Query: VeterinaryVaccinationSchedule.find({ pet })
     │
     ├──► Fetch Appointments
     │    │
     │    ▼
     │    Query: VeterinaryAppointment.find({ petId, ownerId })
     │
     ├──► Build Timeline
     │    │
     │    ▼
     │    Merge: Medical records + Vaccinations + Appointments
     │    │
     │    ▼
     │    Sort by date (most recent first)
     │
     ├──► Calculate Statistics
     │    │
     │    ▼
     │    Count: Total visits, vaccinations
     │    │
     │    ▼
     │    Sum: Total expenses, amount paid
     │    │
     │    ▼
     │    Find: Next appointment, pending follow-ups
     │
     └──► Return Complete Data
          │
          ▼
          Response: {
            pet: { details },
            timeline: [ events ],
            statistics: { metrics },
            currentMedications: [ meds ],
            upcomingAppointments: [ appointments ],
            pendingFollowUps: [ followups ]
          }
```

### Flow 3: Creating Medical Record (Consultation Complete)

```
┌──────────┐
│ Manager  │
│ Completes│
│ Consult  │
└────┬─────┘
     │
     ▼
┌────────────────────────────────┐
│ Consultation Controller        │
│ completeConsultation()          │
└────┬───────────────────────────┘
     │
     ▼
     Create VeterinaryMedicalRecord
     │
     ├──► Store: diagnosis, treatment, notes
     ├──► Store: medications[] with dosages
     ├──► Store: procedures[] performed
     ├──► Store: tests[] conducted
     ├──► Store: vaccinations[] given
     ├──► Store: billing information
     └──► Store: follow-up requirements
          │
          ▼
          Save to Database
          │
          ▼
     ┌────────────────────────┐
     │  Medical Record saved  │
     │  Now visible in:       │
     │  • Manager dashboard   │
     │  • Pet timeline        │
     │  • User medical history│
     └────────────────────────┘
```

---

## Component Interaction Map

```
                    ┌─────────────────────────┐
                    │   User Dashboard        │
                    │   /user/dashboard       │
                    └───────────┬─────────────┘
                                │
                    ┌───────────┴────────────┐
                    │                        │
          ┌─────────▼─────────┐   ┌─────────▼──────────┐
          │  Veterinary       │   │  My Pets           │
          │  Booking          │   │  Dashboard         │
          └─────────┬─────────┘   └─────────┬──────────┘
                    │                       │
                    │         ┌─────────────▼──────────────┐
                    │         │  UserPetsMedicalHistory    │
                    │         │  /user/veterinary/         │
                    │         │  medical-history           │
                    │         └─────────────┬──────────────┘
                    │                       │
                    │         ┌─────────────▼──────────────┐
                    └────────►│  UserPetMedicalHistory     │
                              │  Detail                     │
                              │  /user/veterinary/          │
                              │  medical-history/:petId     │
                              └────────────────────────────┘


                    ┌─────────────────────────┐
                    │   Manager Dashboard     │
                    │   /manager/veterinary   │
                    └───────────┬─────────────┘
                                │
                    ┌───────────┴────────────┐
                    │                        │
          ┌─────────▼─────────┐   ┌─────────▼──────────┐
          │  Appointments     │   │  Patients          │
          │  Management       │   │  Management        │
          └─────────┬─────────┘   └─────────┬──────────┘
                    │                       │
          ┌─────────▼─────────┐             │
          │  Consultation     │             │
          │  Interface        │             │
          └─────────┬─────────┘             │
                    │                       │
                    │         ┌─────────────▼──────────────┐
                    │         │  ComprehensiveMedical      │
                    │         │  Records                    │
                    │         │  /manager/veterinary/       │
                    │         │  medical-records            │
                    │         └─────────────┬──────────────┘
                    │                       │
                    │         ┌─────────────▼──────────────┐
                    └────────►│  PetMedicalTimeline        │
                              │  /manager/veterinary/       │
                              │  pet/:petId/timeline        │
                              └────────────────────────────┘
```

---

## Security & Authorization Flow

```
┌────────────────┐
│   API Request  │
└────────┬───────┘
         │
         ▼
┌─────────────────────────┐
│   Auth Middleware       │
│   • Verify JWT token    │
│   • Extract user info   │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Authorization Check    │
│  • Check user role      │
│  • Verify permissions   │
└────────┬────────────────┘
         │
         ├──► MANAGER?
         │    │
         │    ├─► Yes → Check storeId
         │    │         │
         │    │         ▼
         │    │    ┌──────────────────────┐
         │    │    │ Verify Store Access  │
         │    │    │ • Match storeId      │
         │    │    └──────────────────────┘
         │    │
         │    └─► No → Reject (403)
         │
         └──► USER?
              │
              ├─► Yes → Verify Ownership
              │         │
              │         ▼
              │    ┌──────────────────────┐
              │    │ Check Pet Ownership  │
              │    │ • Match user ID to   │
              │    │   pet owner          │
              │    └──────────────────────┘
              │
              └─► No → Reject (403)
                   │
                   ▼
              Proceed to Controller
```

---

## Database Relationships

```
┌─────────────────┐
│      User       │
│  (Pet Owner)    │
└────────┬────────┘
         │
         │ owns
         │
         ▼
┌─────────────────┐         ┌──────────────────────┐
│      Pet        │◄────────│  VeterinaryMedical   │
│                 │  about  │  Record              │
│ • name          │         │                      │
│ • species       │         │ • visitDate          │
│ • breed         │         │ • diagnosis          │
│ • age           │         │ • treatment          │
│ • owner ────────┼────────►│ • owner              │
└────────┬────────┘         │ • pet                │
         │                  │ • veterinary          │
         │                  │ • staff               │
         │                  │ • medications[]       │
         │                  │ • procedures[]        │
         │                  │ • vaccinations[]      │
         │                  │ • totalCost           │
         │                  │ • paymentStatus       │
         │                  └──────────┬───────────┘
         │                             │
         │                             │ treated at
         │                             │
         │                             ▼
         │                  ┌──────────────────────┐
         │                  │    Veterinary        │
         │                  │    (Clinic)          │
         │                  │                      │
         │                  │ • name               │
         │                  │ • location           │
         │                  │ • storeId            │
         │                  └──────────────────────┘
         │
         │ scheduled for
         │
         ▼
┌─────────────────────────┐
│  VeterinaryAppointment  │
│                         │
│ • petId                 │
│ • ownerId               │
│ • appointmentDate       │
│ • status                │
│ • serviceId             │
└─────────────────────────┘
         │
         │ includes
         │
         ▼
┌─────────────────────────┐
│  VeterinaryService      │
│                         │
│ • name                  │
│ • price                 │
│ • duration              │
└─────────────────────────┘
```

---

## Timeline Construction Algorithm

```
function buildTimeline(pet):
    timeline = []
    
    // 1. Fetch Medical Records
    medicalRecords = VeterinaryMedicalRecord.find({
        pet: pet._id,
        isActive: true
    }).sort({ visitDate: -1 })
    
    for each record in medicalRecords:
        timeline.push({
            type: 'medical_visit',
            date: record.visitDate,
            title: record.diagnosis,
            data: {
                diagnosis: record.diagnosis,
                treatment: record.treatment,
                medications: record.medications,
                procedures: record.procedures,
                cost: record.totalCost,
                paymentStatus: record.paymentStatus,
                veterinarian: record.staff.name,
                clinic: record.veterinary.name
            }
        })
    
    // 2. Fetch Vaccinations
    vaccinations = VeterinaryVaccinationSchedule.find({
        pet: pet._id,
        isActive: true
    }).sort({ vaccinationDate: -1 })
    
    for each vac in vaccinations:
        timeline.push({
            type: 'vaccination',
            date: vac.vaccinationDate || vac.scheduledDate,
            title: vac.vaccineName,
            data: {
                status: vac.status,
                nextDueDate: vac.nextDueDate,
                batchNumber: vac.batchNumber
            }
        })
    
    // 3. Fetch Appointments
    appointments = VeterinaryAppointment.find({
        petId: pet._id
    }).sort({ appointmentDate: -1 })
    
    for each apt in appointments:
        timeline.push({
            type: 'appointment',
            date: apt.appointmentDate,
            title: apt.reason || apt.serviceId.name,
            data: {
                status: apt.status,
                timeSlot: apt.timeSlot,
                clinic: apt.storeId.name
            }
        })
    
    // 4. Sort by date (most recent first)
    timeline.sort((a, b) => b.date - a.date)
    
    return timeline
```

---

This architecture provides a **complete, professional veterinary management system** with proper separation of concerns, security, and scalability! 🏥✨
