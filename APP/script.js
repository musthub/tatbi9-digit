// ==========================================
// 1. INITIALISATION DU SDK PI NETWORK
// ==========================================
const isSandboxMode = true; // Laissez sur true pour vos tests sur https://pinet.com

if (typeof Pi !== 'undefined') {
    Pi.init({ version: "2.0", sandbox: isSandboxMode });
    console.log("Pi SDK initialisé avec succès.");
    
    const statusBox = document.getElementById('status');
    if (statusBox) statusBox.innerText = "SDK connecté. Connexion du Pionnier...";
    
    authentifierPionnier();
}

async function authentifierPionnier() {
    try {
        const scopes = ['username', 'payments'];
        const authResult = await Pi.authenticate(scopes, function(payment) {
            console.log("Paiement suspendu détecté et géré automatiquement :", payment);
            // Optionnel : renvoyer vers la finalisation serveur si nécessaire
        });
        
        console.log("Pionnier connecté :", authResult.user.username);
        const statusBox = document.getElementById('status');
        if (statusBox) statusBox.innerText = "Bienvenue dans l'Espace Culturel, " + authResult.user.username + " !";
        
        return authResult.user;
    } catch (err) {
        console.error("Erreur d'authentification Pi :", err);
    }
}

// ==========================================
// 2. BOUTON BLOCKCHAIN PI (POURBOIRE DE 0.50 Pi)
// ==========================================
async function executerPourboire() {
    try {
        console.log("Déclenchement du paiement Pi Wallet...");
        const paymentData = {
            amount: 0.50,
            memo: "Pourboire - DiGiT Espace Culturel",
            metadata: { type: "pourboire_culturel" }
        };

        const paymentCallbacks = {
            // ÉTAPE 1 : Le portefeuille Pi a créé la commande, votre serveur doit l'approuver
            onReadyForServerApproval: async function (paymentId) { 
                console.log("Transaction créée sur la blockchain. Approbation serveur...");
                try {
                    const response = await fetch('/.netlify/functions/pi-approve', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ paymentId: paymentId })
                    });
                    const result = await response.json();
                    return result.approved;
                } catch (err) {
                    console.error("Échec de l'approbation serveur :", err);
                }
            },
            // ÉTAPE 2 : Le Pionnier a signé, votre serveur doit clore la transaction
            onReadyForServerCompletion: async function (paymentId, txid) { 
                console.log("Transaction signée par le Pionnier. Finalisation...");
                try {
                    await fetch('/.netlify/functions/pi-complete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ paymentId: paymentId, txid: txid })
                    });
                } catch (err) {
                    console.error("Échec de la complétion serveur :", err);
                }
            },
            onCancel: function (paymentId) { alert("Paiement annulé."); },
            onError: function (error, payment) { alert("Erreur lors de la transaction."); }
        };

        const payment = await Pi.createPayment(paymentData, paymentCallbacks);
        alert("Merci infiniment pour vos 0.50 Pi !");
        return payment;
    } catch (error) {
        console.error("Échec de la transaction :", error);
    }
}

// ==========================================
// 3. ENVOI SÉCURISÉ DES DEMANDES À L'IA GEMINI
// ==========================================

async function appelerGeminiTexte(promptUtilisateur, cibleAffichageId, instructionSysteme = "") {
    const zoneAffichage = document.getElementById(cibleAffichageId);
    if (zoneAffichage) zoneAffichage.innerText = "Génération de l'IA en cours...";
    
    try {
        const response = await fetch('/.netlify/functions/gemini-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: promptUtilisateur,
                systemInstruction: instructionSysteme || "Tu es l'IA officielle de l'Espace Culturel des Pionniers DiGiT."
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        if (zoneAffichage) zoneAffichage.innerText = data.text;
    } catch (error) {
        console.error("Erreur IA Texte :", error);
        if (zoneAffichage) zoneAffichage.innerText = "Anomalie technique : Impossible de générer le contenu.";
    }
}

async function appelerImagenArt(promptArt, cibleImageId) {
    const zoneImage = document.getElementById(cibleImageId);
    alert("Le Studio Artistique prépare votre peinture, veuillez patienter...");

    try {
        const response = await fetch('/.netlify/functions/gemini-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: promptArt, aspect_ratio: "1:1" })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        if (zoneImage) {
            zoneImage.src = `data:image/jpeg;base64,${data.imageBase64}`;
            zoneImage.style.display = "inline-block";
        }
    } catch (error) {
        console.error("Erreur IA Image :", error);
        alert("Erreur lors de la génération de l'image.");
    }
}

// ==========================================
// 4. CONNEXION TECHNIQUE À VOS BOUTONS EXISTANTS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const btnPourboire = document.getElementById('btn-pourboire');
    if (btnPourboire) btnPourboire.addEventListener('click', executerPourboire);
});
