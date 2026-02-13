class Note {
    constructor(nom, valeur, pourcentage) {
        this.nom = nom;
        this.valeur = valeur;
        this.pourcentage = pourcentage;
    }
    get points() {
        return this.valeur * (this.pourcentage / 100);
    }
}

class Matiere {
    constructor(nom, coefficient) {
        this.nom = nom;
        this.coefficient = coefficient;
        this.notes = [];
    }
    get moyenne() {
        if (this.notes.length === 0) return 0;
        let totalPoints = 0;
        let totalPourcentage = 0;
        for (let n of this.notes) {
            totalPoints += n.points;
            totalPourcentage += n.pourcentage;
        }
        return totalPourcentage > 0 ? totalPoints : 0;
    }
    get moyenneSur20() {
        return this.moyenne;
    }
    get totalPourcentage() {
        return this.notes.reduce((sum, n) => sum + n.pourcentage, 0);
    }
    get peutAjouterNote() {
        return this.totalPourcentage < 100;
    }
    get restePourcentage() {
        return 100 - this.totalPourcentage;
    }
}

class UE {
    constructor(nom, coefficient) {
        this.nom = nom;
        this.coefficient = coefficient;
        this.matieres = [];
    }
    get moyenne() {
        if (this.matieres.length === 0) return 0;
        let totalPoints = 0;
        let totalCoefs = 0;
        for (let m of this.matieres) {
            totalPoints += m.moyenneSur20 * m.coefficient;
            totalCoefs += m.coefficient;
        }
        return totalCoefs > 0 ? totalPoints / totalCoefs : 0;
    }
}

class Semestre {
    constructor(nom) {
        this.nom = nom;
        this.ues = [];
    }
    get moyenne() {
        if (this.ues.length === 0) return 0;
        let totalPoints = 0;
        let totalCoefs = 0;
        for (let ue of this.ues) {
            totalPoints += ue.moyenne * ue.coefficient;
            totalCoefs += ue.coefficient;
        }
        return totalCoefs > 0 ? totalPoints / totalCoefs : 0;
    }
}

class App {
    constructor() {
        this.semestres = [
            new Semestre('Semestre 1'),
            new Semestre('Semestre 2')
        ];
        this.isDarkMode = false;
        this.currentScreen = 'welcome';
        this.selectedSemestre = null;
        this.selectedUE = null;
        this.selectedMatiere = null;
        this.modalUE = { visible: false, nom: '', coef: '1', isEdit: false, editItem: null };
        this.modalMatiere = { visible: false, nom: '', coef: '1', isEdit: false, editItem: null };
        this.modalNote = { visible: false, nom: '', valeur: '', pourcentage: '100', isEdit: false, editItem: null };
        this.confirmCallback = null;
        this.loadData();
        this.render();
        setTimeout(() => {
            document.getElementById('progress-bar').style.width = '100%';
        }, 100);
        setTimeout(() => {
            document.getElementById('splash-screen').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('splash-screen').style.display = 'none';
            }, 800);
        }, 2000);
        this.initConfirmModal();
        this.initPdfModal();
    }

    initConfirmModal() {
        const cancelBtn = document.getElementById('confirm-cancel');
        const okBtn = document.getElementById('confirm-ok');
        cancelBtn.addEventListener('click', () => {
            document.getElementById('confirm-modal').style.display = 'none';
        });
        okBtn.addEventListener('click', () => {
            if (this.confirmCallback) {
                this.confirmCallback();
            }
            document.getElementById('confirm-modal').style.display = 'none';
        });
    }

    initPdfModal() {
        document.getElementById('pdf-cancel').addEventListener('click', () => {
            document.getElementById('pdf-modal').style.display = 'none';
        });
        document.getElementById('pdf-generate').addEventListener('click', () => {
            const nom = document.getElementById('pdf-nom').value.trim();
            const prenom = document.getElementById('pdf-prenom').value.trim();
            const universite = document.getElementById('pdf-universite').value.trim();
            const niveau = document.getElementById('pdf-niveau').value.trim();
            const annee = document.getElementById('pdf-annee').value.trim();
            const specialite = document.getElementById('pdf-specialite').value.trim();
            
            this.genererPDF({ nom, prenom, universite, niveau, annee, specialite });
            document.getElementById('pdf-modal').style.display = 'none';
            
            document.getElementById('pdf-nom').value = '';
            document.getElementById('pdf-prenom').value = '';
            document.getElementById('pdf-universite').value = '';
            document.getElementById('pdf-niveau').value = '';
            document.getElementById('pdf-annee').value = '';
            document.getElementById('pdf-specialite').value = '';
        });
    }

    showConfirm(message, callback) {
        document.getElementById('confirm-message').textContent = message;
        this.confirmCallback = callback;
        document.getElementById('confirm-modal').style.display = 'flex';
    }

    saveData() {
        try {
            const data = {
                semestres: this.semestres.map(s => ({
                    nom: s.nom,
                    ues: s.ues.map(u => ({
                        nom: u.nom,
                        coefficient: u.coefficient,
                        matieres: u.matieres.map(m => ({
                            nom: m.nom,
                            coefficient: m.coefficient,
                            notes: m.notes.map(n => ({
                                nom: n.nom,
                                valeur: n.valeur,
                                pourcentage: n.pourcentage
                            }))
                        }))
                    }))
                })),
                isDarkMode: this.isDarkMode
            };
            localStorage.setItem('calcul_moyenne', JSON.stringify(data));
        } catch (e) {
            console.log('Erreur sauvegarde', e);
        }
    }

    loadData() {
        try {
            const data = localStorage.getItem('calcul_moyenne');
            if (data) {
                const parsed = JSON.parse(data);
                this.semestres = parsed.semestres.map(s => {
                    const sem = new Semestre(s.nom);
                    sem.ues = s.ues.map(u => {
                        const ue = new UE(u.nom, u.coefficient);
                        ue.matieres = u.matieres.map(m => {
                            const mat = new Matiere(m.nom, m.coefficient);
                            mat.notes = m.notes.map(n => new Note(n.nom, n.valeur, n.pourcentage));
                            return mat;
                        });
                        return ue;
                    });
                    return sem;
                });
                this.isDarkMode = parsed.isDarkMode || false;
            }
        } catch (e) {
            console.log('Erreur chargement', e);
        }
    }

    get moyenneGenerale() {
        let total = 0;
        let count = 0;
        for (let s of this.semestres) {
            if (s.ues.length > 0) {
                total += s.moyenne;
                count++;
            }
        }
        return count > 0 ? total / count : 0;
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        if (this.isDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        this.saveData();
        this.render();
    }

    ajouterUE(semestre, nom, coef) {
        semestre.ues.push(new UE(nom, parseFloat(coef) || 1));
        this.saveData();
        this.render();
    }

    modifierUE(ue, nom, coef) {
        ue.nom = nom;
        ue.coefficient = parseFloat(coef) || ue.coefficient;
        this.saveData();
        this.render();
    }

    supprimerUE(semestre, index) {
        semestre.ues.splice(index, 1);
        this.saveData();
        this.render();
    }

    ajouterMatiere(ue, nom, coef) {
        ue.matieres.push(new Matiere(nom, parseFloat(coef) || 1));
        this.saveData();
        this.render();
    }

    modifierMatiere(matiere, nom, coef) {
        matiere.nom = nom;
        matiere.coefficient = parseFloat(coef) || matiere.coefficient;
        this.saveData();
        this.render();
    }

    supprimerMatiere(ue, index) {
        ue.matieres.splice(index, 1);
        this.saveData();
        this.render();
    }

    ajouterNote(matiere, nom, valeur, pourcentage) {
        const totalActuel = matiere.totalPourcentage;
        const nouveauTotal = totalActuel + parseFloat(pourcentage);
        if (nouveauTotal > 100) {
            alert(`Impossible ! Le total dépasserait ${nouveauTotal}%.\nIl reste ${matiere.restePourcentage}% disponible.`);
            return false;
        }
        matiere.notes.push(new Note(nom, parseFloat(valeur), parseFloat(pourcentage)));
        this.saveData();
        this.render();
        return true;
    }

    modifierNote(note, nom, valeur, pourcentage, matiere) {
        const ancienPourcentage = note.pourcentage;
        const totalSansNote = matiere.totalPourcentage - ancienPourcentage;
        const nouveauTotal = totalSansNote + parseFloat(pourcentage);
        if (nouveauTotal > 100) {
            alert(`Impossible ! Le total dépasserait ${nouveauTotal}%.\nIl reste ${100 - totalSansNote}% disponible.`);
            return false;
        }
        note.nom = nom;
        note.valeur = parseFloat(valeur);
        note.pourcentage = parseFloat(pourcentage);
        this.saveData();
        this.render();
        return true;
    }

    supprimerNote(matiere, index) {
        matiere.notes.splice(index, 1);
        this.saveData();
        this.render();
    }

    genererPDF(donnees) {
        const { nom, prenom, universite, niveau, annee, specialite } = donnees;
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const bleu = [33, 150, 243];
        const gris = [100, 100, 100];
        
        doc.setFillColor(...bleu);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("RELEVÉ DE NOTES", 105, 20, { align: "center" });
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        
        let y = 50;
        let infoCount = 0;
        
        if (nom || prenom) {
            doc.text(`Étudiant: ${nom} ${prenom}`.trim(), 20, y);
            infoCount++;
        }
        if (universite) {
            doc.text(`Université: ${universite}`, 20, y + (infoCount * 7));
            infoCount++;
        }
        if (niveau) {
            doc.text(`Niveau: ${niveau}`, 20, y + (infoCount * 7));
            infoCount++;
        }
        if (annee) {
            doc.text(`Année: ${annee}`, 20, y + (infoCount * 7));
            infoCount++;
        }
        if (specialite) {
            doc.text(`Spécialité: ${specialite}`, 20, y + (infoCount * 7));
        }
        
        const date = new Date().toLocaleDateString('fr-FR');
        doc.text(`Date: ${date}`, 150, 75);
        
        doc.setFillColor(...bleu);
        doc.roundedRect(140, 55, 50, 25, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(`Moy: ${this.moyenneGenerale.toFixed(2)}/20`, 165, 72, { align: "center" });
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Détail des notes", 20, 90);
        
        const tableData = [];
        for (const semestre of this.semestres) {
            if (semestre.ues.length === 0) continue;
            tableData.push([{ content: semestre.nom, colSpan: 4, styles: { fillColor: bleu, textColor: 255, fontStyle: 'bold' } }]);
            for (const ue of semestre.ues) {
                tableData.push([{ content: `  UE: ${ue.nom} (Coef: ${ue.coefficient})`, colSpan: 4, styles: { fillColor: [240, 240, 240], fontStyle: 'bold' } }]);
                for (const matiere of ue.matieres) {
                    tableData.push([`    ${matiere.nom}`, `Coef: ${matiere.coefficient}`, `Moy: ${matiere.moyenneSur20.toFixed(2)}`, '']);
                    for (const note of matiere.notes) {
                        tableData.push(['', note.nom, `${note.valeur.toFixed(1)}/20`, `${note.pourcentage}%`]);
                    }
                    tableData.push(['', '', '', '']);
                }
            }
        }
        
        doc.autoTable({
            startY: 100,
            head: [['Matière/Note', 'Intitulé', 'Note', 'Coeff']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: bleu },
            styles: { fontSize: 10 },
            columnStyles: {
                0: { cellWidth: 60 },
                1: { cellWidth: 50 },
                2: { cellWidth: 30 },
                3: { cellWidth: 30 }
            }
        });
        
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Résumé des moyennes", 20, finalY);
        
        const resumeY = finalY + 10;
        let resumeData = [];
        for (const semestre of this.semestres) {
            if (semestre.ues.length > 0) {
                resumeData.push([semestre.nom, `${semestre.moyenne.toFixed(2)}/20`]);
            }
        }
        
        doc.autoTable({
            startY: resumeY,
            body: resumeData,
            theme: 'grid',
            styles: { fontSize: 12 },
            columnStyles: {
                0: { cellWidth: 80 },
                1: { cellWidth: 40 }
            }
        });
        
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(...gris);
            doc.text(`Généré par Calcul Moyenne - Page ${i}/${totalPages}`, 105, 287, { align: "center" });
        }
        
        const nomFichier = `Releve${nom ? '_' + nom : ''}${prenom ? '_' + prenom : ''}.pdf`;
        doc.save(nomFichier);
    }

    render() {
        const app = document.getElementById('app');
        if (this.currentScreen === 'welcome') {
            app.innerHTML = this.renderWelcome();
        } else if (this.currentScreen === 'semestre') {
            app.innerHTML = this.renderSemestre();
        } else if (this.currentScreen === 'ue') {
            app.innerHTML = this.renderUE();
        } else if (this.currentScreen === 'matiere') {
            app.innerHTML = this.renderMatiere();
        }
        this.attachEvents();
    }

    renderWelcome() {
        return `
            <div class="screen-welcome">
                <div class="header">
                    <div class="logo-container">
                        <span class="logo">SM</span>
                    </div>
                    <h1>Calcul Moyenne</h1>
                    <div class="subtitle">Gère tes notes facilement !</div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <span class="card-label">MOYENNE GÉNÉRALE</span>
                        <span class="theme-toggle" data-action="toggleTheme">${this.isDarkMode ? '☀️' : '🌙'}</span>
                    </div>
                    <div class="moyenne-container">
                        <span class="moyenne">${this.moyenneGenerale.toFixed(2)}</span>
                        <span class="moyenne-unit">/20</span>
                    </div>
                </div>
                
                <div class="buttons-container">
                    <a href="apk/CalculMoy.apk" download class="action-button-link">
                        <button class="action-button apk-btn">
                            <span class="action-button-icon">📲</span>
                            <span>Télécharger l'APK (ANDROID)</span>
                        </button>
                    </a>
                    
                    <button class="action-button pdf-btn" data-action="showPdfForm">
                        <span class="action-button-icon">📄</span>
                        <span>Générer un relevé PDF</span>
                    </button>
                </div>
                
                <div class="section-title">MES SEMESTRES</div>
                <div class="grid">
                    ${this.semestres.map((sem, index) => `
                        <div class="semestre-card" data-semestre-index="${index}">
                            <div class="semestre-nom">${sem.nom}</div>
                            <div class="progress-container">
                                <div class="progress-circle">
                                    <span class="progress-text">${sem.ues.length === 0 ? '0.0' : sem.moyenne.toFixed(1)}</span>
                                    <span class="progress-unit">/20</span>
                                </div>
                            </div>
                            <div class="ue-badge">
                                <span class="ue-badge-text">${sem.ues.length === 0 ? '0 UE' : sem.ues.length + (sem.ues.length > 1 ? ' UEs' : ' UE')}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div style="text-align: center; padding: 20px; color: #757575;">
                    Fait par Samy.M
                </div>
            </div>
        `;
    }

    renderSemestre() {
        const sem = this.selectedSemestre;
        return `
            <div>
                <div class="app-bar">
                    <span class="back-button" data-action="back">←</span>
                    <span class="app-bar-title">${sem.nom}</span>
                    <span class="theme-toggle" data-action="toggleTheme">${this.isDarkMode ? '☀️' : '🌙'}</span>
                </div>
                <div class="card" style="margin: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div class="card-label">Moyenne</div>
                            <div style="display: flex; align-items: flex-end;">
                                <span style="font-size: 32px; font-weight: bold; color: #2196f3;">${sem.ues.length === 0 ? '0.00' : sem.moyenne.toFixed(2)}</span>
                                <span style="font-size: 16px; color: #757575; margin-left: 4px; margin-bottom: 4px;">/20</span>
                            </div>
                        </div>
                        <div style="background-color: #2196f3; padding: 10px 16px; border-radius: 20px;">
                            <span style="color: white; font-weight: bold;">${sem.ues.length} UE</span>
                        </div>
                    </div>
                </div>
                ${sem.ues.length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-icon">📚</div>
                        <div class="empty-title">Aucune UE ajoutée</div>
                        <div class="empty-text">Appuie sur le bouton + pour commencer</div>
                    </div>
                ` : `
                    <div class="list-content">
                        ${sem.ues.map((ue, index) => `
                            <div class="ue-card" data-ue-index="${index}">
                                <div class="ue-header">
                                    <div class="ue-icon">📖</div>
                                    <div class="ue-info">
                                        <div class="ue-nom">${ue.nom}</div>
                                        <div class="ue-coef">Coefficient: ${ue.coefficient}</div>
                                    </div>
                                    <div class="ue-moyenne-badge">${ue.moyenne.toFixed(1)}/20</div>
                                </div>
                                <div class="ue-actions">
                                    <span class="edit-button" data-action="editUE" data-ue-index="${index}">✏️ Modifier</span>
                                    <span class="delete-button" data-action="deleteUE" data-ue-index="${index}">🗑️ Supprimer</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
                <button class="fab" data-action="addUE">
                    <span class="fab-icon">+</span>
                    <span>Ajouter UE</span>
                </button>
                ${this.renderModalUE()}
            </div>
        `;
    }

    renderUE() {
        const ue = this.selectedUE;
        return `
            <div>
                <div class="app-bar" style="background-color: #4caf50;">
                    <span class="back-button" data-action="back">←</span>
                    <span class="app-bar-title">${ue.nom}</span>
                    <span class="theme-toggle" data-action="toggleTheme">${this.isDarkMode ? '☀️' : '🌙'}</span>
                </div>
                <div class="card" style="margin: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div class="card-label">Moyenne UE</div>
                            <div style="display: flex; align-items: flex-end;">
                                <span style="font-size: 36px; font-weight: bold; color: #4caf50;">${ue.matieres.length === 0 ? '0.00' : ue.moyenne.toFixed(2)}</span>
                                <span style="font-size: 16px; color: #757575; margin-left: 4px; margin-bottom: 4px;">/20</span>
                            </div>
                            <div class="ue-coef">Coefficient: ${ue.coefficient}</div>
                        </div>
                        <div style="background-color: #4caf50; padding: 10px 16px; border-radius: 20px;">
                            <span style="color: white; font-weight: bold;">${ue.matieres.length} matière${ue.matieres.length > 1 ? 's' : ''}</span>
                        </div>
                    </div>
                </div>
                ${ue.matieres.length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-icon">📕</div>
                        <div class="empty-title">Aucune matière ajoutée</div>
                        <div class="empty-text">Appuie sur le bouton + pour ajouter une matière</div>
                    </div>
                ` : `
                    <div class="list-content">
                        ${ue.matieres.map((mat, index) => `
                            <div class="mat-card" data-matiere-index="${index}">
                                <div class="mat-header">
                                    <div class="mat-icon">📘</div>
                                    <div class="mat-info">
                                        <div class="mat-nom">${mat.nom}</div>
                                        <div class="mat-coef">Coefficient: ${mat.coefficient}</div>
                                    </div>
                                    <div class="mat-moyenne-badge ${mat.moyenneSur20 < 10 ? 'faible' : ''}" style="background-color: ${mat.moyenneSur20 >= 10 ? '#4caf50' : '#f44336'}">
                                        ${mat.moyenneSur20.toFixed(1)}/20
                                    </div>
                                </div>
                                <div class="mat-actions">
                                    <span class="edit-button" data-action="editMatiere" data-matiere-index="${index}">✏️ Modifier</span>
                                    <span class="delete-button" data-action="deleteMatiere" data-matiere-index="${index}">🗑️ Supprimer</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
                <button class="fab" style="background-color: #4caf50;" data-action="addMatiere">
                    <span class="fab-icon">+</span>
                    <span>Ajouter matière</span>
                </button>
                ${this.renderModalMatiere()}
            </div>
        `;
    }

    renderMatiere() {
        const mat = this.selectedMatiere;
        const totalPourcentage = mat.totalPourcentage;
        const reste = mat.restePourcentage;
        const moyenneColor = mat.moyenneSur20 >= 10 ? '#4caf50' : '#f44336';
        return `
            <div>
                <div class="app-bar" style="background-color: #9c27b0;">
                    <span class="back-button" data-action="back">←</span>
                    <span class="app-bar-title">${mat.nom}</span>
                    <span class="theme-toggle" data-action="toggleTheme">${this.isDarkMode ? '☀️' : '🌙'}</span>
                </div>
                <div class="card" style="margin: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div class="card-label">Moyenne</div>
                            <div style="display: flex; align-items: flex-end;">
                                <span style="font-size: 36px; font-weight: bold; color: ${moyenneColor};">${mat.notes.length === 0 ? '0.00' : mat.moyenneSur20.toFixed(2)}</span>
                                <span style="font-size: 16px; color: #757575; margin-left: 4px; margin-bottom: 4px;">/20</span>
                            </div>
                            <div class="mat-coef">Coefficient: ${mat.coefficient}</div>
                            ${reste > 0 ? `<div style="font-size: 12px; color: #4caf50; margin-top: 5px;">Reste: ${reste}%</div>` : ''}
                        </div>
                        <div class="badge ${totalPourcentage === 100 ? 'badge-green' : 'badge-orange'}">
                            ${totalPourcentage.toFixed(0)}%
                        </div>
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(mat.moyenneSur20 / 20) * 100}%; background-color: ${moyenneColor};"></div>
                </div>
                ${totalPourcentage !== 100 && mat.notes.length > 0 ? `
                    <div class="warning-text">
                        ⚠️ Total: ${totalPourcentage.toFixed(0)}% (doit faire 100%)
                    </div>
                ` : ''}
                ${mat.notes.length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-icon">📝</div>
                        <div class="empty-title">Aucune note ajoutée</div>
                        <div class="empty-text">Appuie sur le bouton + pour ajouter une note</div>
                    </div>
                ` : `
                    <div class="list-content">
                        ${mat.notes.map((note, index) => `
                            <div class="note-card">
                                <div class="note-avatar">
                                    <span>${note.valeur.toFixed(1)}</span>
                                </div>
                                <div class="note-info">
                                    <div class="note-nom">${note.nom}</div>
                                    <div class="note-details">${note.valeur.toFixed(1)}/20 • ${note.pourcentage}%</div>
                                </div>
                                <div class="note-actions">
                                    <span class="note-edit" data-action="editNote" data-note-index="${index}">✏️</span>
                                    <span class="note-delete" data-action="deleteNote" data-note-index="${index}">🗑️</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
                ${reste > 0 ? `
                    <button class="fab" style="background-color: #9c27b0;" data-action="addNote">
                        <span class="fab-icon">+</span>
                        <span>Ajouter note (${reste}%)</span>
                    </button>
                ` : `
                    <div style="position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background-color: #666; color: white; padding: 15px 30px; border-radius: 30px; font-size: 16px; font-weight: bold; opacity: 0.6;">
                        ⚠️ Total 100% atteint
                    </div>
                `}
                ${this.renderModalNote()}
            </div>
        `;
    }

    renderModalUE() {
        if (!this.modalUE.visible) return '';
        return `
            <div class="modal-overlay" data-action="closeModal">
                <div class="modal-content">
                    <div class="modal-title">${this.modalUE.isEdit ? 'Modifier UE' : 'Nouvelle UE'}</div>
                    <input type="text" class="input" placeholder="Nom de l'UE" id="modal-ue-nom" value="${this.modalUE.nom}">
                    <input type="number" class="input" placeholder="Coefficient" id="modal-ue-coef" value="${this.modalUE.coef}" step="0.1">
                    <div class="modal-actions">
                        <span class="cancel-button" data-action="closeModal">Annuler</span>
                        <span class="save-button" data-action="saveUE">${this.modalUE.isEdit ? 'Modifier' : 'Ajouter'}</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderModalMatiere() {
        if (!this.modalMatiere.visible) return '';
        return `
            <div class="modal-overlay" data-action="closeModal">
                <div class="modal-content">
                    <div class="modal-title">${this.modalMatiere.isEdit ? 'Modifier Matière' : 'Nouvelle Matière'}</div>
                    <input type="text" class="input" placeholder="Nom de la matière" id="modal-matiere-nom" value="${this.modalMatiere.nom}">
                    <input type="number" class="input" placeholder="Coefficient" id="modal-matiere-coef" value="${this.modalMatiere.coef}" step="0.1">
                    <div class="modal-actions">
                        <span class="cancel-button" data-action="closeModal">Annuler</span>
                        <span class="save-button" data-action="saveMatiere">${this.modalMatiere.isEdit ? 'Modifier' : 'Ajouter'}</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderModalNote() {
        if (!this.modalNote.visible) return '';
        const mat = this.selectedMatiere;
        const reste = mat ? mat.restePourcentage : 100;
        return `
            <div class="modal-overlay" data-action="closeModal">
                <div class="modal-content">
                    <div class="modal-title">${this.modalNote.isEdit ? 'Modifier Note' : 'Nouvelle Note'}</div>
                    <input type="text" class="input" placeholder="Nom (DS, TP, Examen...)" id="modal-note-nom" value="${this.modalNote.nom}">
                    <input type="number" class="input" placeholder="Note /20" id="modal-note-valeur" value="${this.modalNote.valeur}" step="0.1" min="0" max="20">
                    <input type="number" class="input" placeholder="Pourcentage (%)" id="modal-note-pourcentage" value="${this.modalNote.pourcentage}" step="1" min="0" max="${reste}" oninput="this.max = ${reste}">
                    ${!this.modalNote.isEdit ? `<small style="color: #4caf50; display: block; margin-top: -10px; margin-bottom: 10px;">Maximum: ${reste}%</small>` : ''}
                    <div class="modal-actions">
                        <span class="cancel-button" data-action="closeModal">Annuler</span>
                        <span class="save-button" data-action="saveNote">${this.modalNote.isEdit ? 'Modifier' : 'Ajouter'}</span>
                    </div>
                </div>
            </div>
        `;
    }

    attachEvents() {
        document.querySelectorAll('[data-action="toggleTheme"]').forEach(el => {
            el.addEventListener('click', () => this.toggleTheme());
        });
        document.querySelectorAll('[data-action="back"]').forEach(el => {
            el.addEventListener('click', () => {
                if (this.currentScreen === 'semestre') this.currentScreen = 'welcome';
                else if (this.currentScreen === 'ue') this.currentScreen = 'semestre';
                else if (this.currentScreen === 'matiere') this.currentScreen = 'ue';
                this.render();
            });
        });
        if (this.currentScreen === 'welcome') {
            document.querySelectorAll('.semestre-card').forEach(el => {
                el.addEventListener('click', (e) => {
                    const index = e.currentTarget.dataset.semestreIndex;
                    this.selectedSemestre = this.semestres[index];
                    this.currentScreen = 'semestre';
                    this.render();
                });
            });
            document.querySelectorAll('[data-action="showPdfForm"]').forEach(el => {
                el.addEventListener('click', () => {
                    document.getElementById('pdf-modal').style.display = 'flex';
                });
            });
        }
        if (this.currentScreen === 'semestre') {
            document.querySelectorAll('.ue-card').forEach(el => {
                el.addEventListener('click', (e) => {
                    if (e.target.classList.contains('edit-button') || e.target.classList.contains('delete-button')) return;
                    const index = e.currentTarget.dataset.ueIndex;
                    this.selectedUE = this.selectedSemestre.ues[index];
                    this.currentScreen = 'ue';
                    this.render();
                });
            });
        }
        if (this.currentScreen === 'ue') {
            document.querySelectorAll('.mat-card').forEach(el => {
                el.addEventListener('click', (e) => {
                    if (e.target.classList.contains('edit-button') || e.target.classList.contains('delete-button')) return;
                    const index = e.currentTarget.dataset.matiereIndex;
                    this.selectedMatiere = this.selectedUE.matieres[index];
                    this.currentScreen = 'matiere';
                    this.render();
                });
            });
        }
        if (this.currentScreen === 'semestre') {
            document.querySelectorAll('[data-action="addUE"]').forEach(el => {
                el.addEventListener('click', () => {
                    this.modalUE = { visible: true, nom: '', coef: '1', isEdit: false, editItem: null };
                    this.render();
                });
            });
            document.querySelectorAll('[data-action="editUE"]').forEach(el => {
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const index = e.currentTarget.dataset.ueIndex;
                    const ue = this.selectedSemestre.ues[index];
                    this.modalUE = { 
                        visible: true, 
                        nom: ue.nom, 
                        coef: ue.coefficient.toString(), 
                        isEdit: true, 
                        editItem: ue,
                        editIndex: index
                    };
                    this.render();
                });
            });
            document.querySelectorAll('[data-action="deleteUE"]').forEach(el => {
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const index = e.currentTarget.dataset.ueIndex;
                    this.showConfirm('Êtes-vous sûr de vouloir supprimer cette UE ?', () => {
                        this.supprimerUE(this.selectedSemestre, index);
                    });
                });
            });
        }
        if (this.currentScreen === 'ue') {
            document.querySelectorAll('[data-action="addMatiere"]').forEach(el => {
                el.addEventListener('click', () => {
                    this.modalMatiere = { visible: true, nom: '', coef: '1', isEdit: false, editItem: null };
                    this.render();
                });
            });
            document.querySelectorAll('[data-action="editMatiere"]').forEach(el => {
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const index = e.currentTarget.dataset.matiereIndex;
                    const mat = this.selectedUE.matieres[index];
                    this.modalMatiere = { 
                        visible: true, 
                        nom: mat.nom, 
                        coef: mat.coefficient.toString(), 
                        isEdit: true, 
                        editItem: mat,
                        editIndex: index
                    };
                    this.render();
                });
            });
            document.querySelectorAll('[data-action="deleteMatiere"]').forEach(el => {
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const index = e.currentTarget.dataset.matiereIndex;
                    this.showConfirm('Êtes-vous sûr de vouloir supprimer cette matière ?', () => {
                        this.supprimerMatiere(this.selectedUE, index);
                    });
                });
            });
        }
        if (this.currentScreen === 'matiere') {
            document.querySelectorAll('[data-action="addNote"]').forEach(el => {
                el.addEventListener('click', () => {
                    this.modalNote = { visible: true, nom: '', valeur: '', pourcentage: '100', isEdit: false, editItem: null };
                    this.render();
                });
            });
            document.querySelectorAll('[data-action="editNote"]').forEach(el => {
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const index = e.currentTarget.dataset.noteIndex;
                    const note = this.selectedMatiere.notes[index];
                    this.modalNote = { 
                        visible: true, 
                        nom: note.nom, 
                        valeur: note.valeur.toString(), 
                        pourcentage: note.pourcentage.toString(), 
                        isEdit: true, 
                        editItem: note,
                        editIndex: index
                    };
                    this.render();
                });
            });
            document.querySelectorAll('[data-action="deleteNote"]').forEach(el => {
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const index = e.currentTarget.dataset.noteIndex;
                    this.showConfirm('Êtes-vous sûr de vouloir supprimer cette note ?', () => {
                        this.supprimerNote(this.selectedMatiere, index);
                    });
                });
            });
        }
        document.querySelectorAll('[data-action="closeModal"]').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target === e.currentTarget || e.currentTarget.classList.contains('cancel-button')) {
                    this.modalUE.visible = false;
                    this.modalMatiere.visible = false;
                    this.modalNote.visible = false;
                    this.render();
                }
            });
        });
        document.querySelectorAll('[data-action="saveUE"]').forEach(el => {
            el.addEventListener('click', () => {
                const nom = document.getElementById('modal-ue-nom')?.value;
                const coef = document.getElementById('modal-ue-coef')?.value;
                if (nom && nom.trim()) {
                    if (this.modalUE.isEdit) {
                        this.modifierUE(this.modalUE.editItem, nom, coef);
                    } else {
                        this.ajouterUE(this.selectedSemestre, nom, coef);
                    }
                    this.modalUE.visible = false;
                    this.render();
                }
            });
        });
        document.querySelectorAll('[data-action="saveMatiere"]').forEach(el => {
            el.addEventListener('click', () => {
                const nom = document.getElementById('modal-matiere-nom')?.value;
                const coef = document.getElementById('modal-matiere-coef')?.value;
                if (nom && nom.trim()) {
                    if (this.modalMatiere.isEdit) {
                        this.modifierMatiere(this.modalMatiere.editItem, nom, coef);
                    } else {
                        this.ajouterMatiere(this.selectedUE, nom, coef);
                    }
                    this.modalMatiere.visible = false;
                    this.render();
                }
            });
        });
        document.querySelectorAll('[data-action="saveNote"]').forEach(el => {
            el.addEventListener('click', () => {
                const nom = document.getElementById('modal-note-nom')?.value;
                const valeur = document.getElementById('modal-note-valeur')?.value;
                const pourcentage = document.getElementById('modal-note-pourcentage')?.value;
                if (nom && nom.trim() && valeur && valeur.trim()) {
                    const valNum = parseFloat(valeur) || 0;
                    const pctNum = parseFloat(pourcentage) || 0;
                    if (valNum >= 0 && valNum <= 20 && pctNum >= 0 && pctNum <= 100) {
                        if (this.modalNote.isEdit) {
                            this.modifierNote(this.modalNote.editItem, nom, valeur, pourcentage, this.selectedMatiere);
                        } else {
                            this.ajouterNote(this.selectedMatiere, nom, valeur, pourcentage);
                        }
                        this.modalNote.visible = false;
                        this.render();
                    }
                }
            });
        });
    }
}

const app = new App();