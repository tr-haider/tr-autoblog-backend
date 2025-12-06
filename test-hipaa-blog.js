require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function generateAndEmailBlog() {
  console.log('🤖 AutoBlog AI - Generating HIPAA Blog & Emailing to Marketing Team...\n');

  try {
    // Check if the application is running
    console.log('1. Checking application status...');
    try {
      await axios.get(`${BASE_URL}/blog-generator/health`);
      console.log('✅ Application is running');
    } catch (error) {
      console.log('❌ Application is not running. Please start it first:');
      console.log('   npm run start:dev');
      return;
    }

    // Generate a trending HIPAA blog
    console.log('\n2. Generating trending HIPAA blog...');
    const blogResponse = await axios.post(`${BASE_URL}/blog-generator/generate-trending`);
    
    if (!blogResponse.data.success) {
      console.log('❌ Blog generation failed:', blogResponse.data.error);
      return;
    }

    console.log('✅ Blog generated successfully!');
    console.log(`📝 Title: ${blogResponse.data.blogPost.title}`);
    console.log(`📊 Word count: ${blogResponse.data.blogPost.wordCount}`);
    console.log(`⏱️ Reading time: ${blogResponse.data.blogPost.readingTime} minutes`);
    console.log(`🏷️ Keywords: ${blogResponse.data.blogPost.keywords.join(', ')}`);

    // Email the blog to marketing team
    console.log('\n3. Emailing blog to marketing team...');
    const emailResponse = await axios.post(`${BASE_URL}/scheduler/trigger-weekly`);
    
    if (emailResponse.data.success) {
      console.log('✅ Email sent successfully to marketing team!');
      console.log('📧 Message:', emailResponse.data.message);
      
      console.log('\n📄 Blog Summary:');
      console.log('='.repeat(60));
      console.log(`Title: ${blogResponse.data.blogPost.title}`);
      console.log(`Topic: ${blogResponse.data.blogPost.topic}`);
      console.log(`Word Count: ${blogResponse.data.blogPost.wordCount}`);
      console.log(`Reading Time: ${blogResponse.data.blogPost.readingTime} minutes`);
      console.log(`Keywords: ${blogResponse.data.blogPost.keywords.join(', ')}`);
      console.log(`Status: ${blogResponse.data.blogPost.status}`);
      console.log('='.repeat(60));
      
      console.log('\n🎉 Blog generation and email distribution completed successfully!');
      console.log('📬 Check your marketing team\'s email for the new blog post.');
      
    } else {
      console.log('❌ Email sending failed:', emailResponse.data.message);
      console.log('\n💡 Email configuration tips:');
      console.log('   - Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS in .env');
      console.log('   - Set MARKETING_TEAM_EMAILS in .env');
      console.log('   - Example: MARKETING_TEAM_EMAILS=marketing@company.com,content@company.com');
      
      console.log('\n📄 Blog was generated but not emailed. You can manually copy the content.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure the application is running: npm run start:dev');
    console.log('2. Check your .env file has GROQ API key: LLM_API_KEY=your_key');
    console.log('3. Verify email settings in .env file');
    console.log('4. Check GROQ API key is valid and has credits');
  }
}

// Run the blog generation and email process
generateAndEmailBlog(); 