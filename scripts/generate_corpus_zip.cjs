const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

// Ensure corpus directory exists
const corpusDir = path.join(__dirname, '..', 'corpus');
if (!fs.existsSync(corpusDir)) {
  fs.mkdirSync(corpusDir, { recursive: true });
}

// 1. Define Sales Representatives (10 reps)
const reps = [
  { name: 'John Rep', email: 'john.rep@qordata.com' },
  { name: 'Bob Sales', email: 'bob.sales@qordata.com' },
  { name: 'Alice Rep', email: 'alice.rep@qordata.com' },
  { name: 'Sarah MSL', email: 'sarah.msl@qordata.com' },
  { name: 'David Rep', email: 'david.rep@qordata.com' },
  { name: 'Emma Sales', email: 'emma.sales@qordata.com' },
  { name: 'James Rep', email: 'james.rep@qordata.com' },
  { name: 'Grace MSL', email: 'grace.msl@qordata.com' },
  { name: 'Michael Sales', email: 'michael.sales@qordata.com' },
  { name: 'Sophie Rep', email: 'sophie.rep@qordata.com' }
];

// 2. Define Doctors (50 doctors)
const docNames = [
  'Smith', 'Jones', 'Miller', 'Wilson', 'Brown', 'Davis', 'Moore', 'Taylor', 'Thomas', 'Jackson',
  'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis',
  'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'Hernandez', 'King', 'Wright', 'Lopez', 'Hill',
  'Scott', 'Green', 'Adams', 'Baker', 'Gonzalez', 'Nelson', 'Carter', 'Mitchell', 'Perez', 'Roberts',
  'Turner', 'Phillips', 'Campbell', 'Parker', 'Evans', 'Edwards', 'Collins', 'Stewart', 'Sanchez', 'Morris'
];
const doctors = docNames.map(name => {
  const cleanName = name.toLowerCase();
  const domains = ['hopkinsmedicine.org', 'cardio-specialists.com', 'medcenter.org', 'clinic.org', 'hospital.org', 'universityhealth.org'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return {
    name: `Dr. ${name}`,
    email: `dr.${cleanName}@${domain}`
  };
});

// Patient names for HIPAA violation template
const patients = [
  'Mary Jenkins', 'Robert Chen', 'Linda Kowalski', 'James Carter', 'William Brady', 
  'Patricia Kelly', 'John Doe', 'Elizabeth Vargas', 'Michael Chang', 'Barbara Olsen'
];

// 3. Email Templates by Violation Category
const templates = {
  OFF_LABEL_PROMOTION: [
    {
      subject: 'CardioRex clinical data for younger patients',
      body: 'Hi {doctor_name}, wanted to share some recent clinical slides showing Cardiorex works wonders for pediatric asthma. The FDA label only covers adult hypertension, but our studies show 95% efficacy in children under 12. Let me know if you would like some off-label samples.'
    },
    {
      subject: 'New trials for CardioRex in diabetes',
      body: 'Dear {doctor_name}, did you see the new trials for Cardiorex on adolescent diabetes? It is not on the official FDA label yet, but several clinicians are prescribing it off-label in their practice with great success. I can drop off detailed trial booklets next week.'
    },
    {
      subject: 'Pediatric samples and brochures',
      body: 'Hey {doctor_name}, I can drop off some off-label samples next week for pediatric asthma if you want to try it out on your younger patients. We are seeing amazing results despite the label restrictions.'
    }
  ],
  KICKBACK_BRIBERY: [
    {
      subject: 'Speaking invitation & consulting agreement',
      body: 'Hi {doctor_name}, we would love to have you speak at our upcoming Cardiorex dinner program. We can offer you an honorarium of $8,000 for a 15-minute presentation. Since you are our top prescriber in the region, this is our way of showing appreciation. We do not need to log this in the transparency portal if we split it into four smaller consult fees.'
    },
    {
      subject: 'Sponsorship for upcoming cardiology summit',
      body: 'Dear {doctor_name}, thanks for meeting with me yesterday. We can sponsor your registration and travel for the upcoming European cardiology summit ($12,000 package) if you can increase your prescriptions of Cardiorex next month.'
    },
    {
      subject: 'Small token of appreciation',
      body: 'Hi {doctor_name}, I wanted to drop off a $500 gift card to Amazon as a small thank you for your loyal support and for keeping Cardiorex as your first-line choice in your clinic. Let me know if you need more samples.'
    }
  ],
  MEDICAL_COMMERCIAL_BOUNDARY: [
    {
      subject: 'Unpublished Phase III CardioRex data',
      body: 'Dear {doctor_name}, here is the unpublished Phase III data on the Cardiorex mechanism of action in renal impairment. I wanted to share this reactively so we can discuss potential investigator-initiated studies.'
    },
    {
      subject: 'Internal slides: pediatric Cardiorex trials',
      body: 'Hi {doctor_name}, I have attached our internal clinical report detailing off-label pediatric studies. Please do not share this widely as it is for scientific information boundaries.'
    },
    {
      subject: 'CardioRex molecular pathways review',
      body: 'Hi {doctor_name}, please review the attached slide deck on the molecular pathways of Cardiorex. I can set up a call with our research team to explore this further, as this unpublished data is highly restricted.'
    }
  ],
  HIPAA_PII_LEAK: [
    {
      subject: 'Follow up on patient {patient_name}',
      body: 'Hi {doctor_name}, regarding our patient {patient_name} (DOB: 10/12/1974), I wanted to check if you reviewed her chart details. Her chart number is MRN-88291 and she is on Cardiorex 20mg.'
    },
    {
      subject: 'Medical records attachment',
      body: 'Dear {doctor_name}, I have attached the medical records and clinical history for patient {patient_name} who suffered a hives reaction. The chart details and SSN are enclosed.'
    },
    {
      subject: 'Dosing adjust for patient {patient_name}',
      body: 'Hi {doctor_name}, please see the clinical history of patient {patient_name} (SSN: {ssn}). They need a dosing adjustment for Cardiorex immediately.'
    }
  ],
  ADVERSE_EVENT_UNREPORTED: [
    {
      subject: 'Patient side effects query',
      body: 'Hi {doctor_name}, one of my patients, {patient_name}, started Cardiorex last week and experienced severe dizziness and hives. She ended up going to the ER. Let me know if you need more samples of the 20mg strength.'
    },
    {
      subject: 'Severe reaction report',
      body: 'Dear {doctor_name}, a patient reported severe muscle pain and fainting after taking Cardiorex 20mg. I will drop off some replacement samples tomorrow and check on them.'
    },
    {
      subject: 'Hives and vomiting issue',
      body: 'Hi {doctor_name}, a rep mentioned a patient suffered severe hives and vomiting after starting the new dosing. I wanted to see if they are doing okay now or if we need to adjust their prescriptions.'
    }
  ],
  NONE: [
    {
      subject: 'Thank you for your time - product brochure delivery',
      body: 'Hi {doctor_name}, thank you for your time yesterday. I wanted to confirm the delivery date for the standard brochures and patient starter kits for Cardiorex.'
    },
    {
      subject: 'CardioRex dosing in renal impairment query follow-up',
      body: 'Dear {doctor_name}, in response to your specific question regarding Cardiorex dosing in renal impairment patients, I have attached the latest Phase II clinical study details as a reactive response. Let me know if you have questions.'
    },
    {
      subject: 'Scheduled product briefing reminder',
      body: 'Hi {doctor_name}, hope you are doing well. Just a quick reminder about our scheduled product briefing next Tuesday at 10 AM. Let me know if that still works for you.'
    }
  ]
};

// Helper to generate a random SSN
function randomSSN() {
  return `${Math.floor(Math.random()*899+100)}-${Math.floor(Math.random()*89+10)}-${Math.floor(Math.random()*8999+1000)}`;
}

// Generate an email body and subject based on template
function generateEmail(category, doctor, index) {
  const categoryTemplates = templates[category];
  const template = categoryTemplates[index % categoryTemplates.length];
  
  const patient = patients[index % patients.length];
  const ssn = randomSSN();
  
  let subject = template.subject
    .replace(/{doctor_name}/g, doctor.name)
    .replace(/{patient_name}/g, patient);
    
  let body = template.body
    .replace(/{doctor_name}/g, doctor.name)
    .replace(/{patient_name}/g, patient)
    .replace(/{ssn}/g, ssn);
    
  // Add some slight randomness to content to ensure unique hashes/bodies
  body += `\n\nRef ID: Ref-${100000 + index}-${Math.floor(Math.random() * 9000)}`;

  return { subject, body };
}

// 4. Main script loop
console.log('Generating 5,000 emails distributed across 10 reps (500 each)...');

const emailsPerRep = 500;
const totalEmails = reps.length * emailsPerRep;

reps.forEach((rep, repIdx) => {
  const zip = new AdmZip();
  const repNameClean = rep.name.replace(/\s+/g, '_').toLowerCase();
  
  console.log(`Generating emails for ${rep.name} (${emailsPerRep} emails)...`);
  
  for (let i = 0; i < emailsPerRep; i++) {
    const emailIndex = repIdx * emailsPerRep + i;
    
    // Choose violation category: 85% NONE (clean), 15% violations distributed
    let category = 'NONE';
    const rand = Math.random();
    if (rand < 0.03) {
      category = 'OFF_LABEL_PROMOTION';
    } else if (rand < 0.06) {
      category = 'KICKBACK_BRIBERY';
    } else if (rand < 0.09) {
      category = 'MEDICAL_COMMERCIAL_BOUNDARY';
    } else if (rand < 0.12) {
      category = 'HIPAA_PII_LEAK';
    } else if (rand < 0.15) {
      category = 'ADVERSE_EVENT_UNREPORTED';
    }
    
    const doctor = doctors[emailIndex % doctors.length];
    const { subject, body } = generateEmail(category, doctor, emailIndex);
    
    // Random date within the last 90 days
    const dateOffsetMs = Math.floor(Math.random() * 90 * 24 * 3600 * 1000);
    const date = new Date(Date.now() - dateOffsetMs);
    const dateStr = date.toUTCString();
    
    // Format MIME EML content
    const emlContent = `From: ${rep.name} <${rep.email}>
To: ${doctor.name} <${doctor.email}>
Subject: ${subject}
Date: ${dateStr}
MIME-Version: 1.0
Content-Type: text/plain; charset="utf-8"

${body}
`;

    // Add EML file to zip in-memory
    const filename = `email_${emailIndex}.eml`;
    zip.addFile(filename, Buffer.from(emlContent, 'utf-8'));
  }
  
  // Write the zip to disk
  const zipPath = path.join(corpusDir, `rep_${repNameClean}.zip`);
  zip.writeZip(zipPath);
  console.log(`Saved ZIP archive for ${rep.name} to: ${zipPath}`);
});

console.log(`Corpus generation complete! Generated 10 ZIP files in: ${corpusDir}`);
