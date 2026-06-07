const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const { simpleParser } = require('mailparser');
const { Firestore } = require('@google-cloud/firestore');
const { GoogleGenAI, Type } = require('@google/genai');

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve static files from the React dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Initialize Gemini SDK
// Default to the provided API key if not set in environment, to guarantee out-of-the-box operation.
const geminiKey = process.env.GEMINI_API_KEY || 'AIzaSyDKMOQKUTsCsHa3h02SyHkIfLVk8kBdvuM';
const ai = new GoogleGenAI({ apiKey: geminiKey });

// Initialize Firestore
let db;
let isFirestoreAvailable = false;
try {
  // Check if we are running in GCP or have project configured
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'qordata-comms-mon-2026';
  db = new Firestore({ projectId });
  isFirestoreAvailable = true;
  console.log(`Firestore initialized for project: ${projectId}`);
} catch (err) {
  console.warn('Firestore failed to initialize. Falling back to in-memory store:', err.message);
}

// In-Memory Fallback Database
const memoryDb = {
  communications: [
    {
      id: 'comm-1',
      sender: 'john.rep@qordata.com',
      recipient: 'dr.smith@hopkinsmedicine.org',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      source: 'EMAIL',
      subject: 'Follow up on our discussion regarding Cardiorex',
      body: 'Dear Dr. Smith, thank you for lunch yesterday. As promised, I wanted to share some trials showing Cardiorex works wonders for pediatric asthma, even though the current FDA label only covers adult hypertension. I can drop off some off-label samples next week if you can increase your prescriptions of Cardiorex.',
      riskScore: 92,
      riskCategory: 'OFF_LABEL_PROMOTION',
      severity: 'HIGH',
      status: 'FLAGGED',
      explanation: 'Sender promoting Cardiorex for pediatric asthma which is an off-label use not approved by the FDA. Additionally, the sender links providing samples to an increase in prescriptions, which presents a kickback/bribery risk.',
      flaggedSentences: [
        'showing Cardiorex works wonders for pediatric asthma, even though the current FDA label only covers adult hypertension.',
        'I can drop off some off-label samples next week if you can increase your prescriptions of Cardiorex.'
      ]
    },
    {
      id: 'comm-2',
      sender: 'sarah.msl@qordata.com',
      recipient: 'dr.jones@cardio-specialists.com',
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      source: 'EMAIL',
      subject: 'Scientific Inquiry - Cardiorex renal dosing studies',
      body: 'Dear Dr. Jones, in response to your specific question regarding Cardiorex dosing in renal impairment patients, I have attached the latest Phase II clinical study details. As a reminder, Cardiorex is not currently indicated for patients with severe renal failure, but this data represents our latest scientific research. Please let me know if you would like a call to discuss the molecular mechanism.',
      riskScore: 18,
      riskCategory: 'NONE',
      severity: 'NONE',
      status: 'DISMISSED',
      explanation: 'Medical Science Liaison (MSL) reactively sharing renal data in response to a documented scientific inquiry. This is compliant with boundaries, as long as it is non-promotional and reactive.',
      flaggedSentences: []
    },
    {
      id: 'comm-3',
      sender: 'bob.sales@qordata.com',
      recipient: 'dr.miller@medcenter.org',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      source: 'EMAIL',
      subject: 'Speaking invitation & consulting agreement',
      body: 'Hey Dr. Miller, we would love to have you speak at our upcoming Cardiorex dinner program. We can offer you an honorarium of $8,000 for a 15-minute presentation. Since you are our top prescriber in the region, this is our way of showing appreciation. We do not need to log this in the transparency portal if we split it into four smaller consult fees.',
      riskScore: 95,
      riskCategory: 'KICKBACK_BRIBERY',
      severity: 'HIGH',
      status: 'FLAGGED',
      explanation: 'Sender offering an excessive speaker fee ($8,000 for 15 mins) and explicitly stating it is "appreciation" for being a top prescriber. It also suggests evading transparency reporting regulations, indicating severe bribery and compliance risks.',
      flaggedSentences: [
        'Since you are our top prescriber in the region, this is our way of showing appreciation.',
        'We do not need to log this in the transparency portal if we split it into four smaller consult fees.'
      ]
    },
    {
      id: 'comm-4',
      sender: 'alice.rep@qordata.com',
      recipient: 'dr.wilson@clinic.org',
      timestamp: new Date(Date.now() - 3600000 * 30).toISOString(),
      source: 'EMAIL',
      subject: 'Cardiorex samples and adverse events',
      body: 'Hi Dr. Wilson, thanks for yesterday. One of my patients, Mary Jenkins, started Cardiorex last week and experienced severe dizziness and hives. She ended up going to the ER. Anyway, I wanted to ask if you need more samples of the 20mg strength.',
      riskScore: 85,
      riskCategory: 'ADVERSE_EVENT_UNREPORTED',
      severity: 'HIGH',
      status: 'FLAGGED',
      explanation: 'The email contains an adverse event report (patient Mary Jenkins experiencing severe dizziness and hives requiring ER visit on Cardiorex). Company policy and FDA regulations require reps to forward adverse events to safety within 24 hours. The rep did not escalate this and instead asked about samples.',
      flaggedSentences: [
        'One of my patients, Mary Jenkins, started Cardiorex last week and experienced severe dizziness and hives.',
        'She ended up going to the ER.'
      ]
    }
  ],
  exchangeConfig: {
    tenantId: 'd65b128c-4f9e-4b6e-a23d-0b61c9441112',
    clientId: '9f816281-2292-4fbc-b0c6-df21cc6f4142',
    status: 'CONNECTED',
    mailboxes: [
      { email: 'john.rep@qordata.com', name: 'John Rep (Sales - Northeast)', monitored: true, status: 'ACTIVE', lastScanned: new Date().toISOString() },
      { email: 'bob.sales@qordata.com', name: 'Bob Sales (Sales - Mid-Atlantic)', monitored: true, status: 'ACTIVE', lastScanned: new Date().toISOString() },
      { email: 'alice.rep@qordata.com', name: 'Alice Rep (Sales - Southeast)', monitored: true, status: 'ACTIVE', lastScanned: new Date().toISOString() },
      { email: 'sarah.msl@qordata.com', name: 'Sarah MSL (Medical affairs)', monitored: false, status: 'INACTIVE' }
    ],
    syncFrequencyMinutes: 15,
    lastSync: new Date().toISOString()
  },
  apiKeys: [
    { keyId: 'api-1', apiKey: 'qd_live_83b1a20822bf9100cb92e8fa', description: 'Exchange Webhook Ingestion API', createdDate: new Date().toISOString(), callsCount: 24, lastUsed: new Date().toISOString() }
  ],
  policies: [
    { id: 'pol-1', name: 'Off-Label Promotion', description: 'Checks for sales representatives promoting medical products for indications, dosages, or patient populations not approved in the FDA label.', riskCategory: 'OFF_LABEL_PROMOTION', severity: 'HIGH', enabled: true, keywords: ['pediatric', 'asthma', 'off-label', 'not approved', 'off label', 'works well for', 'studies show efficacy in'] },
    { id: 'pol-2', name: 'Kickbacks and Bribery', description: 'Monitors communication for promises of compensation, expensive gifts, meals, or speaker fees linked to prescription volumes or product usage.', riskCategory: 'KICKBACK_BRIBERY', severity: 'HIGH', enabled: true, keywords: ['prescriber', 'appreciation', 'honorarium', 'cash', 'gift card', 'tickets', 'avoid reporting', 'under the table', 'speakers bureau'] },
    { id: 'pol-3', name: 'Medical/Commercial Boundary', description: 'Ensures commercial roles (sales reps) do not distribute scientific materials reactively or cross boundaries designated for Medical Liaisons (MSLs).', riskCategory: 'MEDICAL_COMMERCIAL_BOUNDARY', severity: 'MEDIUM', enabled: true, keywords: ['clinical trials', 'phase III', 'mechanism of action', 'unpublished data', 'dosing studies', 'investigator-initiated'] },
    { id: 'pol-4', name: 'HIPAA and PII Leakage', description: 'Flag emails containing patient-identifiable healthcare records, medical history, full names, or clinical details violating HIPAA privacy rules.', riskCategory: 'HIPAA_PII_LEAK', severity: 'HIGH', enabled: true, keywords: ['patient name', 'SSN', 'medical record', ' Jenkins', 'Smith', 'DOB', 'patient records', 'chart details'] },
    { id: 'pol-5', name: 'Adverse Event Unreported', description: 'Detects patient safety complaints, side effects, or product failures which representatives are legally required to report within 24 hours.', riskCategory: 'ADVERSE_EVENT_UNREPORTED', severity: 'HIGH', enabled: true, keywords: ['side effect', 'adverse event', 'dizziness', 'hives', 'hospital', 'passed out', 'vomiting', 'rash', 'reaction', 'ER visit'] }
  ],
  auditLogs: [
    { id: 'audit-1', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), user: 'compliance.officer@qordata.com', action: 'FLAG_REVIEW', details: 'Reviewed flag on Cardiorex email from Bob Sales' }
  ]
};

// Firestore helper functions
const getDocs = async (collection) => {
  if (isFirestoreAvailable) {
    const snap = await db.collection(collection).get();
    const data = [];
    snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
    return data;
  }
  return memoryDb[collection];
};

const setDoc = async (collection, docId, data) => {
  if (isFirestoreAvailable) {
    await db.collection(collection).doc(docId).set(data, { merge: true });
    return;
  }
  const idx = memoryDb[collection].findIndex(item => item.id === docId);
  if (idx > -1) {
    memoryDb[collection][idx] = { ...memoryDb[collection][idx], ...data };
  } else {
    memoryDb[collection].push({ id: docId, ...data });
  }
};

const addDoc = async (collection, data) => {
  const docId = data.id || `${collection.slice(0, 4)}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  data.id = docId;
  await setDoc(collection, docId, data);
  return docId;
};

// Multer in-memory storage for email uploads
const upload = multer({ storage: multer.memoryStorage() });

// --- AI Analysis Core ---
let isGeminiAvailable = true;

async function analyzeContentWithGemini(subject, body, policies) {
  if (!isGeminiAvailable) {
    return runHeuristicFallback(body, policies);
  }

  try {
    const enabledPolicies = policies.filter(p => p.enabled);
    const policyPrompt = enabledPolicies.map(p => {
      return `- **${p.riskCategory}**: ${p.description} (Keywords: ${p.keywords.join(', ')})`;
    }).join('\n');

    const prompt = `You are a compliance officer auditing communications for a life sciences pharmaceutical company.
Analyze the following communication:
Subject: "${subject || 'None'}"
Body: "${body}"


Evaluate the body against these specific compliance risk categories:
${policyPrompt}

Guidelines:
1. If the communication content violates one or more of these policies, classify it under the most severe matching category.
2. If it is completely safe and standard, choose 'NONE'.
3. Risk Score: 0 (safe) to 100 (extreme risk). Assign scores above 75 for clear violations, 40-74 for borderline issues, and under 40 for safe.
4. Flagged Sentences: Return an array of the exact sentences from the body that directly triggered the risk.
5. Explanation: Provide a detailed summary explaining the risk.

Return a strictly formatted JSON object with the following fields:
{
  "riskScore": number (0 to 100),
  "riskCategory": string (one of the Risk Categories listed above, or 'NONE'),
  "severity": string ("HIGH", "MEDIUM", "LOW", or "NONE"),
  "explanation": string,
  "flaggedSentences": string[]
}`;

    const aiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskScore: { type: Type.INTEGER },
            riskCategory: { type: Type.STRING },
            severity: { type: Type.STRING },
            explanation: { type: Type.STRING },
            flaggedSentences: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['riskScore', 'riskCategory', 'severity', 'explanation', 'flaggedSentences']
        }
      }
    });

    const parsedResult = JSON.parse(aiResponse.text);
    return parsedResult;
  } catch (err) {
    console.error('Gemini AI Analysis Error, running heuristic fallback:', err.message);
    const errMsg = err.message || '';
    if (errMsg.includes('key') || errMsg.includes('API_KEY') || errMsg.includes('PERMISSION_DENIED') || errMsg.includes('leaked') || errMsg.includes('403')) {
      isGeminiAvailable = false;
      console.warn('Gemini API key is invalid or leaked. Switching to local heuristic scanner permanently for this session.');
    }
    // Heuristic Fallback
    return runHeuristicFallback(body, policies);
  }
}

// Heuristic Fallback in case AI key is missing/limit exceeded
function runHeuristicFallback(body, policies) {
  const lowercaseBody = body.toLowerCase();
  let selectedPolicy = null;
  let maxMatchedKeywords = 0;

  for (const policy of policies) {
    if (!policy.enabled) continue;
    let matchedKeywords = 0;
    for (const keyword of policy.keywords) {
      if (lowercaseBody.includes(keyword.toLowerCase())) {
        matchedKeywords++;
      }
    }
    if (matchedKeywords > maxMatchedKeywords) {
      maxMatchedKeywords = matchedKeywords;
      selectedPolicy = policy;
    }
  }

  if (selectedPolicy && maxMatchedKeywords > 0) {
    const score = Math.min(40 + maxMatchedKeywords * 15, 98);
    const severity = score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW';
    const sentences = body.split(/[.!?]+/).map(s => s.trim()).filter(s => {
      return selectedPolicy.keywords.some(k => s.toLowerCase().includes(k.toLowerCase()));
    });

    return {
      riskScore: score,
      riskCategory: selectedPolicy.riskCategory,
      severity,
      explanation: `[FALLBACK SCANNER] Content matched policy keywords: "${selectedPolicy.name}". Triggered by match for words like ${selectedPolicy.keywords.filter(k => lowercaseBody.includes(k.toLowerCase())).slice(0, 3).join(', ')}.`,
      flaggedSentences: sentences.slice(0, 3)
    };
  }

  return {
    riskScore: 0,
    riskCategory: 'NONE',
    severity: 'NONE',
    explanation: 'No compliance risks identified in local heuristic analysis.',
    flaggedSentences: []
  };
}

// --- REST API Endpoints ---

// 1. Get stats
app.get('/api/stats', async (req, res) => {
  try {
    const comms = await getDocs('communications');
    const stats = {
      totalScanned: comms.length,
      totalFlagged: comms.filter(c => c.status === 'FLAGGED').length,
      totalDismissed: comms.filter(c => c.status === 'DISMISSED').length,
      totalEscalated: comms.filter(c => c.status === 'ESCALATED').length,
      totalPendingRep: comms.filter(c => c.status === 'PENDING_EXPLANATION').length,
      sourceBreakdown: { email: 0, text: 0, social: 0 },
      categoryBreakdown: {
        OFF_LABEL_PROMOTION: 0,
        KICKBACK_BRIBERY: 0,
        MEDICAL_COMMERCIAL_BOUNDARY: 0,
        HIPAA_PII_LEAK: 0,
        ADVERSE_EVENT_UNREPORTED: 0,
        NONE: 0
      },
      severityBreakdown: { HIGH: 0, MEDIUM: 0, LOW: 0, NONE: 0 }
    };

    comms.forEach(c => {
      // Source
      if (c.source === 'EMAIL') stats.sourceBreakdown.email++;
      else if (c.source === 'TEXT') stats.sourceBreakdown.text++;
      else if (c.source === 'SOCIAL') stats.sourceBreakdown.social++;

      // Category
      if (stats.categoryBreakdown[c.riskCategory] !== undefined) {
        stats.categoryBreakdown[c.riskCategory]++;
      }

      // Severity
      if (stats.severityBreakdown[c.severity] !== undefined) {
        stats.severityBreakdown[c.severity]++;
      }
    });

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch statistics.' });
  }
});

// 2. Get communications list
app.get('/api/comms', async (req, res) => {
  try {
    const comms = await getDocs('communications');
    // Sort by timestamp desc
    comms.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(comms);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch communications.' });
  }
});

// 3. Update communication status
app.patch('/api/comms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, explanation } = req.body;
    const comms = await getDocs('communications');
    const comm = comms.find(c => c.id === id);
    if (!comm) return res.status(404).json({ error: 'Communication not found' });

    comm.status = status;
    if (explanation) comm.explanation = explanation;

    await setDoc('communications', id, comm);

    // Audit log
    await addDoc('auditLogs', {
      timestamp: new Date().toISOString(),
      user: req.headers['x-user-email'] || 'compliance.officer@qordata.com',
      action: `STATUS_${status}`,
      details: `Updated communication status for ${id} to ${status}.`
    });

    res.json(comm);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update communication.' });
  }
});

// 4. Ingest Communication from API (External Webhook)
app.post('/api/ingest', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'] || '';
    const providedKey = authHeader.replace('Bearer ', '').trim();
    
    const apiKeys = await getDocs('apiKeys');
    const keyMatch = apiKeys.find(k => k.apiKey === providedKey);
    if (!keyMatch) {
      return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
    }

    const { sender, recipient, subject, body, source } = req.body;
    if (!sender || !recipient || !body) {
      return res.status(400).json({ error: 'Missing required fields: sender, recipient, body' });
    }

    // Update API Key usage stats
    keyMatch.callsCount++;
    keyMatch.lastUsed = new Date().toISOString();
    await setDoc('apiKeys', keyMatch.id, keyMatch);

    // Run AI scanning
    const policies = await getDocs('policies');
    const aiResult = await analyzeContentWithGemini(subject, body, policies);

    const newComm = {
      sender,
      recipient,
      timestamp: new Date().toISOString(),
      source: source || 'EMAIL',
      subject: subject || '',
      body,
      status: aiResult.riskCategory !== 'NONE' ? 'FLAGGED' : 'DISMISSED',
      ...aiResult
    };

    const id = await addDoc('communications', newComm);
    res.json({ success: true, id, analysis: aiResult });
  } catch (err) {
    console.error('Ingestion Error:', err);
    res.status(500).json({ error: 'Failed to ingest communication.' });
  }
});

// 5. File Upload EML parser endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const policies = await getDocs('policies');

    if (file.originalname.toLowerCase().endsWith('.zip')) {
      const AdmZip = require('adm-zip');
      const zip = new AdmZip(file.buffer);
      const zipEntries = zip.getEntries();
      const processedComms = [];

      for (const entry of zipEntries) {
        if (entry.isDirectory) continue;
        const entryName = entry.entryName;
        if (entryName.includes('__MACOSX') || path.basename(entryName).startsWith('.')) continue;
        if (!entryName.toLowerCase().endsWith('.eml') && !entryName.toLowerCase().endsWith('.txt')) continue;

        let emailDetails = {
          sender: 'unknown@example.com',
          recipient: 'unknown@example.com',
          subject: path.basename(entryName),
          body: ''
        };

        const entryBuffer = entry.getData();
        if (entryName.toLowerCase().endsWith('.eml')) {
          const parsed = await simpleParser(entryBuffer);
          emailDetails.sender = parsed.from && parsed.from.text ? parsed.from.text : 'unknown@example.com';
          emailDetails.recipient = parsed.to && parsed.to.text ? parsed.to.text : 'unknown@example.com';
          emailDetails.subject = parsed.subject || path.basename(entryName);
          emailDetails.body = parsed.text || parsed.html || '';
        } else {
          emailDetails.body = entryBuffer.toString('utf-8');
        }

        const aiResult = await analyzeContentWithGemini(emailDetails.subject, emailDetails.body, policies);

        const newComm = {
          sender: emailDetails.sender,
          recipient: emailDetails.recipient,
          timestamp: new Date().toISOString(),
          source: 'EMAIL',
          subject: emailDetails.subject,
          body: emailDetails.body,
          originalFilename: path.basename(entryName),
          status: aiResult.riskCategory !== 'NONE' ? 'FLAGGED' : 'DISMISSED',
          ...aiResult
        };

        await addDoc('communications', newComm);
        processedComms.push(newComm);
      }

      return res.json({ success: true, comms: processedComms });
    }

    let emailDetails = {
      sender: 'unknown@example.com',
      recipient: 'unknown@example.com',
      subject: file.originalname,
      body: ''
    };

    if (file.originalname.toLowerCase().endsWith('.eml')) {
      // Parse EML
      const parsed = await simpleParser(file.buffer);
      emailDetails.sender = parsed.from && parsed.from.text ? parsed.from.text : 'unknown@example.com';
      emailDetails.recipient = parsed.to && parsed.to.text ? parsed.to.text : 'unknown@example.com';
      emailDetails.subject = parsed.subject || file.originalname;
      emailDetails.body = parsed.text || parsed.html || '';
    } else {
      // Treat as plain text
      emailDetails.body = file.buffer.toString('utf-8');
    }

    // Call AI scanner
    const aiResult = await analyzeContentWithGemini(emailDetails.subject, emailDetails.body, policies);

    const newComm = {
      sender: emailDetails.sender,
      recipient: emailDetails.recipient,
      timestamp: new Date().toISOString(),
      source: 'EMAIL',
      subject: emailDetails.subject,
      body: emailDetails.body,
      originalFilename: file.originalname,
      status: aiResult.riskCategory !== 'NONE' ? 'FLAGGED' : 'DISMISSED',
      ...aiResult
    };

    const id = await addDoc('communications', newComm);
    res.json({ success: true, id, comm: newComm });
  } catch (err) {
    console.error('Upload Processing Error:', err);
    res.status(500).json({ error: 'Failed to process upload file.' });
  }
});

// 6. Test AI Policy Sandbox
app.post('/api/sandbox', async (req, res) => {
  try {
    const { body, subject } = req.body;
    if (!body) return res.status(400).json({ error: 'Missing body text' });

    const policies = await getDocs('policies');
    const aiResult = await analyzeContentWithGemini(subject || '', body, policies);
    res.json(aiResult);
  } catch (err) {
    res.status(500).json({ error: 'Sandbox scan failed.' });
  }
});

// 7. Policies API
app.get('/api/policies', async (req, res) => {
  try {
    const policies = await getDocs('policies');
    res.json(policies);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch policies.' });
  }
});

app.put('/api/policies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const policyUpdate = req.body;
    await setDoc('policies', id, policyUpdate);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update policy.' });
  }
});

// 8. Exchange Config API
app.get('/api/exchange/config', async (req, res) => {
  try {
    if (isFirestoreAvailable) {
      const doc = await db.collection('appConfig').doc('exchangeConfig').get();
      if (doc.exists) return res.json(doc.data());
    }
    res.json(memoryDb.exchangeConfig);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Exchange configuration.' });
  }
});

app.put('/api/exchange/config', async (req, res) => {
  try {
    const configData = req.body;
    if (isFirestoreAvailable) {
      await db.collection('appConfig').doc('exchangeConfig').set(configData, { merge: true });
    } else {
      memoryDb.exchangeConfig = { ...memoryDb.exchangeConfig, ...configData };
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save Exchange configuration.' });
  }
});

// Exchange Connection Tester Simulation
app.post('/api/exchange/test', async (req, res) => {
  try {
    const { tenantId, clientId, clientSecret } = req.body;
    if (!tenantId || !clientId || !clientSecret) {
      return res.status(400).json({ error: 'Missing tenantId, clientId, or clientSecret' });
    }

    // Simulate OAuth & token authorization checks step-by-step
    const steps = [
      'Initiating connection to login.microsoftonline.com...',
      'Authenticating Tenant Authority Client ID...',
      'Exchanging secret credentials for MS Graph Access Token...',
      'Authorized: Scopes approved [Mail.Read, Mail.ReadBasic, Directory.Read.All]',
      'Testing Exchange Web Services endpoint /v1.0/users...',
      'Active Sync connection established.'
    ];

    res.json({ success: true, steps });
  } catch (err) {
    res.status(500).json({ error: 'Exchange connection failed.' });
  }
});

// 9. API Keys management
app.get('/api/api-keys', async (req, res) => {
  try {
    const keys = await getDocs('apiKeys');
    res.json(keys);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch API keys.' });
  }
});

app.post('/api/api-keys', async (req, res) => {
  try {
    const { description } = req.body;
    const apiKey = 'qd_live_' + require('crypto').randomBytes(12).toString('hex');
    const newKey = {
      apiKey,
      description: description || 'External integration',
      createdDate: new Date().toISOString(),
      callsCount: 0
    };
    await addDoc('apiKeys', newKey);
    res.json(newKey);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create API key.' });
  }
});

// 10. Audit Logs
app.get('/api/audit-logs', async (req, res) => {
  try {
    const logs = await getDocs('auditLogs');
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit logs.' });
  }
});

// Single Page Application routing - serve index.html for non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Seeding Firestore if empty
async function seedFirestoreIfNeeded() {
  if (!isFirestoreAvailable) return;
  try {
    const policiesSnap = await db.collection('policies').get();
    if (policiesSnap.empty) {
      console.log('Seeding default policies to Firestore...');
      for (const policy of memoryDb.policies) {
        await db.collection('policies').doc(policy.id).set(policy);
      }
      console.log('Seeding default policies completed.');
    }
    
    const exchangeConfigDoc = await db.collection('appConfig').doc('exchangeConfig').get();
    if (!exchangeConfigDoc.exists) {
      console.log('Seeding default Exchange config to Firestore...');
      await db.collection('appConfig').doc('exchangeConfig').set(memoryDb.exchangeConfig);
    }

    const apiKeysSnap = await db.collection('apiKeys').get();
    if (apiKeysSnap.empty) {
      console.log('Seeding default API keys to Firestore...');
      for (const key of memoryDb.apiKeys) {
        await db.collection('apiKeys').doc(key.keyId).set(key);
      }
    }
  } catch (err) {
    console.error('Error seeding Firestore:', err.message);
  }
}

app.listen(port, () => {
  console.log(`Comms Monitoring App Server running on port ${port}`);
  if (isFirestoreAvailable) {
    seedFirestoreIfNeeded();
  }
});
