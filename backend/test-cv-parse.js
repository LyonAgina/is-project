require('dotenv').config();
const extractCvText = require('./utils/extractCvText');

async function test() {
  const cvUrl = '/uploads/cv_22_1783241041878.pdf';

  console.log('Testing CV extraction for:', cvUrl);
  const text = await extractCvText(cvUrl);

  console.log('--- Extracted text length:', text.length, 'characters ---');
  console.log('--- First 500 characters ---');
  console.log(text.slice(0, 500));
  console.log('--- End ---');
}

test();