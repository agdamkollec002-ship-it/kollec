const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Uploads qovluğunu yoxla/yarat
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Fayl yükləmə konfiqurasiyası
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.doc', '.docx'];
        const fileExt = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(fileExt)) {
            cb(null, true);
        } else {
            cb(new Error('Yalnız PDF və Word faylları yükləyə bilərsiniz!'));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Verilənlər bazası (müvəqqəti olaraq JSON faylı)
const dataFile = path.join(__dirname, 'data.json');

// Verilənləri yüklə
function loadData() {
    try {
        if (fs.existsSync(dataFile)) {
            return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
    
    // Default strukturu
    return {
        files: [],
        credentials: {
            teachers: {
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
            },
            modules: {
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
            }
        }
    };
}

// Verilənləri saxla
function saveData(data) {
    try {
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        return false;
    }
}

// Əsas route
app.get('/', (req, res) => {
    res.json({
        message: 'Salam qaqa! Backend işləyir!',
        developer: 'Kamil',
        timestamp: new Date().toISOString(),
        features: ['Fayl yükləmə', 'Paylaşım', 'Real-time yeniləmə']
    });
});

// Bütün faylları gətir (frontend üçün)
app.get('/api/files', (req, res) => {
    const data = loadData();
    res.json(data.files || []);
});

// Müəllim fayllarını gətir
app.get('/api/teacher-files', (req, res) => {
    const data = loadData();
    res.json(data.files || []);
});

// Müəllim girişi (frontend endpointinə uyğun)
app.post('/api/teacher-login', (req, res) => {
    const { username, password } = req.body;
    const data = loadData();
    
    if (data.credentials.teachers[username] && data.credentials.teachers[username].password === password) {
        res.json({
            success: true,
            subject: data.credentials.teachers[username].subject,
            message: 'Giriş uğurlu!'
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'İstifadəçi adı və ya şifrə yanlışdır!'
        });
    }
});

// Modul girişi
app.post('/api/module-login', (req, res) => {
    const { subject, username, password } = req.body;
    const data = loadData();
    
    if (data.credentials.modules[subject] && 
        data.credentials.modules[subject].username === username && 
        data.credentials.modules[subject].password === password) {
        res.json({
            success: true,
            message: 'Giriş uğurlu!'
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'İstifadəçi adı və ya şifrə yanlışdır!'
        });
    }
});

// Fayl yüklə (frontend endpointinə uyğun)
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Fayl seçilməyib!'
            });
        }

        const data = loadData();
        
        // Yeni fayl obyekti yarat
        const fileObj = {
            id: Date.now(),
            originalname: req.file.originalname,
            filename: req.file.filename,
            url: `/uploads/${req.file.filename}`,
            type: path.extname(req.file.originalname).toLowerCase() === '.pdf' ? 'pdf' : 'word',
            size: req.file.size,
            uploadedAt: new Date().toISOString()
        };

        // Faylı verilənlər bazasına əlavə et
        if (!data.files) {
            data.files = [];
        }
        
        data.files.push(fileObj);
        
        // Saxla
        if (saveData(data)) {
            res.json({
                success: true,
                message: 'Fayl uğurla yükləndi!',
                file: fileObj
            });
        } else {
            throw new Error('Verilənlər bazasına yazıla bilmədi');
        }
        
    } catch (error) {
        console.error('Upload error:', error);
        
        // Yüklənmiş faylı sil
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({
            success: false,
            message: 'Fayl yüklənmədi: ' + error.message
        });
    }
});

// Fayl adını yenilə (frontend endpointinə uyğun)
app.post('/api/update-filename', (req, res) => {
    const { fileId, newName } = req.body;
    
    if (!fileId || !newName) {
        return res.status(400).json({
            success: false,
            message: 'Fayl ID və yeni ad tələb olunur!'
        });
    }

    const data = loadData();
    
    if (data.files) {
        const fileIndex = data.files.findIndex(f => f.id == fileId);
        
        if (fileIndex !== -1) {
            data.files[fileIndex].originalname = newName;
            
            if (saveData(data)) {
                res.json({
                    success: true,
                    message: 'Fayl adı yeniləndi!',
                    file: data.files[fileIndex]
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Yeniləmə uğursuz oldu!'
                });
            }
        } else {
            res.status(404).json({
                success: false,
                message: 'Fayl tapılmadı!'
            });
        }
    } else {
        res.status(404).json({
            success: false,
            message: 'Heç bir fayl tapılmadı!'
        });
    }
});

// Faylı sil (frontend endpointinə uyğun)
app.post('/api/delete-file', (req, res) => {
    const { fileId } = req.body;
    
    if (!fileId) {
        return res.status(400).json({
            success: false,
            message: 'Fayl ID tələb olunur!'
        });
    }

    const data = loadData();
    
    if (data.files) {
        const fileIndex = data.files.findIndex(f => f.id == fileId);
        
        if (fileIndex !== -1) {
            const file = data.files[fileIndex];
            
            // Fiziki faylı sil
            try {
                const filePath = path.join(uploadsDir, file.filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (error) {
                console.error('Fayl silinərkən xəta:', error);
            }
            
            // Verilənlər bazasından sil
            data.files.splice(fileIndex, 1);
            
            if (saveData(data)) {
                res.json({
                    success: true,
                    message: 'Fayl uğurla silindi!'
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Silinmə uğursuz oldu!'
                });
            }
        } else {
            res.status(404).json({
                success: false,
                message: 'Fayl tapılmadı!'
            });
        }
    } else {
        res.status(404).json({
            success: false,
            message: 'Heç bir fayl tapılmadı!'
        });
    }
});

// Şifrəni yenilə (frontend endpointinə uyğun)
app.post('/api/update-password', (req, res) => {
    const { teacher, currentPassword, newPassword } = req.body;
    
    if (!teacher || !currentPassword || !newPassword) {
        return res.status(400).json({
            success: false,
            message: 'Bütün məlumatlar tələb olunur!'
        });
    }

    const data = loadData();
    
    if (data.credentials.teachers[teacher] && 
        data.credentials.teachers[teacher].password === currentPassword) {
        
        data.credentials.teachers[teacher].password = newPassword;
        
        if (saveData(data)) {
            res.json({
                success: true,
                message: 'Şifrə uğurla yeniləndi!'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Şifrə yenilənmədi!'
            });
        }
    } else {
        res.status(401).json({
            success: false,
            message: 'Cari şifrə yanlışdır!'
        });
    }
});

// Xəta idarəetmə middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'Fayl ölçüsü çox böyükdür! Maksimum 10MB'
            });
        }
    }
    
    res.status(500).json({
        success: false,
        message: error.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint tapılmadı!'
    });
});

// Serveri başlat
app.listen(PORT, () => {
    console.log(`🚀 Server http://localhost:${PORT} ünvanında işləyir`);
    console.log(`📁 Upload qovluğu: ${uploadsDir}`);
    console.log(`📊 Verilənlər faylı: ${dataFile}`);
    console.log(`🔧 Frontend üçün hazır!`);
});