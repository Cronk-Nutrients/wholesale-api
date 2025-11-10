// api/create-wholesale-customer.js

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_API_VERSION = '2024-10';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const formData = req.body;

    // Build comprehensive customer note
    let noteContent = '===== WHOLESALE APPLICATION =====\n\n';
    noteContent += '--- CONTACT INFORMATION ---\n';
    noteContent += `Phone: ${formData.phone}\n\n`;
    noteContent += '--- BUSINESS INFORMATION ---\n';
    noteContent += `Company Name: ${formData.company}\n`;
    noteContent += `Business Type: ${formData.businessType}\n`;
    noteContent += `Tax ID/License: ${formData.taxID}\n\n`;
    noteContent += '--- BUSINESS ADDRESS ---\n';
    noteContent += `${formData.address1}\n`;
    if (formData.address2) noteContent += `${formData.address2}\n`;
    noteContent += `${formData.city}, ${formData.province} ${formData.zip}\n`;
    noteContent += `${formData.country}\n\n`;
    
    if (formData.website || formData.monthlyVolume || formData.referralSource) {
      noteContent += '--- ADDITIONAL INFORMATION ---\n';
      if (formData.website) noteContent += `Website: ${formData.website}\n`;
      if (formData.monthlyVolume) noteContent += `Est. Monthly Volume: ${formData.monthlyVolume}\n`;
      if (formData.referralSource) noteContent += `Referral Source: ${formData.referralSource}\n`;
      noteContent += '\n';
    }
    
    if (formData.comments) {
      noteContent += '--- COMMENTS ---\n';
      noteContent += `${formData.comments}\n\n`;
    }
    
    noteContent += '--- APPLICATION STATUS ---\n';
    noteContent += `Submitted: ${new Date().toLocaleString()}\n`;
    noteContent += 'Status: PENDING REVIEW\n';

    // Build customer data for Shopify API
    const customerData = {
      customer: {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        tags: 'wholesale',
        note: noteContent,
        verified_email: false,
        email_marketing_consent: {
          state: formData.acceptsMarketing ? 'subscribed' : 'not_subscribed',
          opt_in_level: 'single_opt_in',
          consent_updated_at: new Date().toISOString()
        },
        addresses: [{
          address1: formData.address1,
          address2: formData.address2 || '',
          city: formData.city,
          province: formData.province,
          zip: formData.zip,
          country: formData.country,
          company: formData.company,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone
        }]
      }
    };

    // Call Shopify Admin API to create customer
    const response = await fetch(
      `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_API_VERSION}/customers.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN
        },
        body: JSON.stringify(customerData)
      }
    );

    const result = await response.json();

    if (response.ok && result.customer) {
      // Success!
      return res.status(200).json({
        success: true,
        customerId: result.customer.id,
        message: 'Wholesale application submitted successfully'
      });
    } else {
      // Shopify API error
      console.error('Shopify API error:', result);
      return res.status(400).json({
        success: false,
        message: result.errors ? JSON.stringify(result.errors) : 'Failed to create customer'
      });
    }
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
}
