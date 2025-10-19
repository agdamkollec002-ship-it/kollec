const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Upload qovluğunu yoxla
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Fayl saxlama konfiqurasiyası
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.doc', '.docx'];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        
        if (allowedTypes.includes(fileExtension)) {
            cb(null, true);
        } else {
            cb(new Error('Yalnız PDF və Word faylları icazə verilir!'));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

// Məlumatları yüklə
let fileData = {};
let teacherCredentials = {};
let moduleCredentials = {};

function loadData() {
    if (fs.existsSync('data.json')) {
        const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
        
        // Köhnə strukturdan yeni strukturə keçid
        if (data.files && Array.isArray(data.files)) {
            // Köhnə faylları yeni strukturda saxla
            fileData = {
                transport: { lecture: [], colloquium: [], seminar: [] },
                computer: { lecture: [], colloquium: [], seminar: [] },
                math: { lecture: [], colloquium: [], seminar: [] },
                economics: { lecture: [], colloquium: [], seminar: [] },
                azerbaijani: { lecture: [], colloquium: [], seminar: [] },
                english: { lecture: [], colloquium: [], seminar: [] },
                physical: { lecture: [], colloquium: [], seminar: [] },
                pedagogy: { lecture: [], colloquium: [], seminar: [] },
                agriculture: { lecture: [], colloquium: [], seminar: [] },
                history: { lecture: [], colloquium: [], seminar: [] }
            };
            
            // Köhnə faylları default olaraq lecture moduluna əlavə et
            data.files.forEach(file => {
                // Fayl adından fənn təxmin et (sadə məntiq)
                let subject = 'transport'; // default
                
                if (file.originalname.toLowerCase().includes('riyaziyyat') || file.originalname.toLowerCase().includes('math')) {
                    subject = 'math';
                } else if (file.originalname.toLowerCase().includes('iqtisadiyyat') || file.originalname.toLowerCase().includes('economics')) {
                    subject = 'economics';
                }
                // Digər fənləri də əlavə edə bilərsiniz
                
                fileData[subject].lecture.push({
                    ...file,
                    module: 'lecture'
                });
            });
        } else {
            fileData = data.fileData || {
                transport: { lecture: [], colloquium: [], seminar: [] },
                computer: { lecture: [], colloquium: [], seminar: [] },
                math: { lecture: [], colloquium: [], seminar: [] },
                economics: { lecture: [], colloquium: [], seminar: [] },
                azerbaijani: { lecture: [], colloquium: [], seminar: [] },
                english: { lecture: [], colloquium: [], seminar: [] },
                physical: { lecture: [], colloquium: [], seminar: [] },
                pedagogy: { lecture: [], colloquium: [], seminar: [] },
                agriculture: { lecture: [], colloquium: [], seminar: [] },
                history: { lecture: [], colloquium: [], seminar: [] }
            };
        }
        
        teacherCredentials = data.credentials?.teachers || {
            'Nəqliyyat': { password: 'pass1234', subject: 'transport' },
            'Kompyuter sistemləri': { password: 'pass1234', subject: 'computer' },
            'Riyaziyyat': { password: 'pass1234', subject: 'math' },
            'İqtisadiyyat': { password: 'pass1234', subject: 'economics' },
            'Azərbaycan dili': { password: 'pass1234', subject: 'azerbaijani' },
            'İngilis dili': { password: 'pass1234', subject: 'english' },
            'Fiziki tərbiyə': { password: 'pass1234', subject: 'physical' },
            'Pedaqogika': { password: 'pass1234', subject: 'pedagogy' },
            'Kənd təsərrüfatı': { password: 'pass1234', subject: 'agriculture' },
            'Tarix': { password: 'pass1234', subject: 'history' }
        };
        
        moduleCredentials = data.credentials?.modules || {
            'transport': { username: 'neqliyyat', password: 'pass1234' },
            'computer': { username: 'kompyuter', password: 'pass1234' },
            'math': { username: 'riyaziyyat', password: 'pass1234' },
            'economics': { username: 'iqtisadiyyat', password: 'pass1234' },
            'azerbaijani': { username: 'azdili', password: 'pass1234' },
            'english': { username: 'ingilisdili', password: 'pass1234' },
            'physical': { username: 'fiziki', password: 'pass1234' },
            'pedagogy': { username: 'pedagogiya', password: 'pass1234' },
            'agriculture': { username: 'kend', password: 'pass1234' },
            'history': { username: 'tarix', password: 'pass1234' }
        };
    } else {
        // Default strukturu yarat
        initializeDefaultData();
    }
}

function initializeDefaultData() {
    fileData = {
        transport: { lecture: [], colloquium: [], seminar: [] },
        computer: { lecture: [], colloquium: [], seminar: [] },
        math: { lecture: [], colloquium: [], seminar: [] },
        economics: { lecture: [], colloquium: [], seminar: [] },
        azerbaijani: { lecture: [], colloquium: [], seminar: [] },
        english: { lecture: [], colloquium: [], seminar: [] },
        physical: { lecture: [], colloquium: [], seminar: [] },
        pedagogy: { lecture: [], colloquium: [], seminar: [] },
        agriculture: { lecture: [], colloquium: [], seminar: [] },
        history: { lecture: [], colloquium: [], seminar: [] }
    };
    
    teacherCredentials = {
        'Nəqliyyat': { password: 'pass1234', subject: 'transport' },
        'Kompyuter sistemləri': { password: 'pass1234', subject: 'computer' },
        'Riyaziyyat': { password: 'pass1234', subject: 'math' },
        'İqtisadiyyat': { password: 'pass1234', subject: 'economics' },
        'Azərbaycan dili': { password: 'pass1234', subject: 'azerbaijani' },
        'İngilis dili': { password: 'pass1234', subject: 'english' },
        'Fiziki tərbiyə': { password: 'pass1234', subject: 'physical' },
        'Pedaqogika': { password: 'pass1234', subject: 'pedagogy' },
        'Kənd təsərrüfatı': { password: 'pass1234', subject: 'agriculture' },
        'Tarix': { password: 'pass1234', subject: 'history' }
    };
    
    moduleCredentials = {
        'transport': { username: 'neqliyyat', password: 'pass1234' },
        'computer': { username: 'kompyuter', password: 'pass1234' },
        'math': { username: 'riyaziyyat', password: 'pass1234' },
        'economics': { username: 'iqtisadiyyat', password: 'pass1234' },
        'azerbaijani': { username: 'azdili', password: 'pass1234' },
        'english': { username: 'ingilisdili', password: 'pass1234' },
        'physical': { username: 'fiziki', password: 'pass1234' },
        'pedagogy': { username: 'pedagogiya', password: 'pass1234' },
        'agriculture': { username: 'kend', password: 'pass1234' },
        'history': { username: 'tarix', password: 'pass1234' }
    };
}

// Məlumatları yadda saxla
function saveData() {
    const data = {
        fileData,
        credentials: {
            teachers: teacherCredentials,
            modules: moduleCredentials
        }
    };
    fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
}

// API Route-ları
app.get('/api/data', (req, res) => {
    res.json(fileData);
});

app.get('/api/teachers', (req, res) => {
    res.json(teacherCredentials);
});

app.get('/api/modules', (req, res) => {
    res.json(moduleCredentials);
});

// Fənn və modula görə faylları gətir - HƏR KƏS GÖRƏ BİLƏR
app.get('/api/files/:subject/:module', (req, res) => {
    const { subject, module } = req.params;
    
    if (fileData[subject] && fileData[subject][module]) {
        res.json(fileData[subject][module]);
    } else {
        res.json([]);
    }
});

// Müəllim girişi
app.post('/api/teacher-login', (req, res) => {
    const { username, password } = req.body;
    
    if (teacherCredentials[username] && teacherCredentials[username].password === password) {
        res.json({
            success: true,
            subject: teacherCredentials[username].subject,
            message: 'Giriş uğurlu!'
        });
    } else {
        res.json({
            success: false,
            message: 'İstifadəçi adı və ya şifrə yanlışdır!'
        });
    }
});

// Modul girişi
app.post('/api/module-login', (req, res) => {
    const { subject, username, password } = req.body;
    
    if (moduleCredentials[subject] && 
        moduleCredentials[subject].username === username && 
        moduleCredentials[subject].password === password) {
        res.json({
            success: true,
            message: 'Modul açıldı!'
        });
    } else {
        res.json({
            success: false,
            message: 'İstifadəçi adı və ya şifrə yanlışdır!'
        });
    }
});

// Fayl yükləmə
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Fayl yüklənmədi!' });
        }

        const { subject, module, type } = req.body;
        
        if (!subject || !module) {
            return res.status(400).json({ error: 'Fənn və modul tələb olunur!' });
        }

        const fileInfo = {
            id: Date.now(),
            originalname: req.file.originalname,
            filename: req.file.filename,
            url: `/uploads/${req.file.filename}`,
            type: type || (req.file.originalname.toLowerCase().endsWith('.pdf') ? 'pdf' : 'word'),
            size: req.file.size,
            uploadedAt: new Date().toISOString()
        };

        if (!fileData[subject]) {
            fileData[subject] = { lecture: [], colloquium: [], seminar: [] };
        }
        
        fileData[subject][module].push(fileInfo);
        saveData();

        console.log(`✅ Yeni fayl: ${fileInfo.originalname} -> ${subject}/${module}`);

        res.json({
            success: true,
            message: 'Fayl uğurla yükləndi!',
            file: fileInfo
        });

    } catch (error) {
        console.error('Fayl yükləmə xətası:', error);
        res.status(500).json({ error: 'Fayl yükləmə uğursuz oldu!' });
    }
});

// Müəllim fayllarını gətir
app.get('/api/teacher-files/:subject', (req, res) => {
    const { subject } = req.params;
    res.json(fileData[subject] || { lecture: [], colloquium: [], seminar: [] });
});

// Serveri başlat
loadData();
app.listen(PORT, () => {
    console.log(`🚀 Server http://localhost:${PORT} ünvanında işləyir`);
    console.log('📁 Fayllar frontend-də AÇILACAQ!');
    console.log('✅ Hazır fayllar:', Object.keys(fileData).length, 'fənn');
});
