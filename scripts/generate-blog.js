#!/usr/bin/env node

const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

async function generateAndEmailBlog() {
  console.log('🤖 AutoBlog AI - Standalone Blog Generation & Email\n');

  try {
    // Check if the application is running
    console.log('1. Checking application status...');
    try {
      await axios.get(`${BASE_URL}/blog-generator/health`, { timeout: 5000 });
      console.log('✅ Application is running');
    } catch (error) {
      console.log('❌ Application is not running. Starting standalone mode...');
      return await generateStandaloneBlog();
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

    // Email the blog to marketing team
    console.log('\n3. Emailing blog to marketing team...');
    const emailResponse = await axios.post(`${BASE_URL}/scheduler/trigger-weekly`);
    
    if (emailResponse.data.success) {
      console.log('✅ Email sent successfully to marketing team!');
      console.log('📧 Message:', emailResponse.data.message);
    } else {
      console.log('❌ Email sending failed:', emailResponse.data.message);
    }

    console.log('\n🎉 Blog generation and email distribution completed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n🔧 Please check your configuration and try again.');
  }
}

async function generateStandaloneBlog() {
  console.log('📝 Generating blog in standalone mode...');
  
  // This would require the full application logic to be embedded
  // For now, just show instructions
  console.log('💡 To use standalone mode, please:');
  console.log('   1. Start the application: npm run start:dev');
  console.log('   2. Run: npm run blog');
  console.log('   3. Or use the web interface at http://localhost:3000');
}

// Run the blog generation and email process
generateAndEmailBlog(); 