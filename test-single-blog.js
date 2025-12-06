const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function generateSingleBlog() {
  console.log('🤖 AutoBlog AI - Generating Single Blog on Random Trending Topic...\n');

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

    // Get a random trending topic first
    console.log('\n2. Getting random trending topic...');
    const trendingResponse = await axios.get(`${BASE_URL}/topic-research/random`);
    const trendingTopic = trendingResponse.data;
    
    console.log(`📝 Selected trending topic: ${trendingTopic.title}`);
    console.log(`🏷️ Keywords: ${trendingTopic.keywords.join(', ')}`);
    
    // Generate a single blog with the trending topic and standard format
    console.log('\n3. Generating blog with standard format...');
    const blogResponse = await axios.post(`${BASE_URL}/blog-generator/generate`, {
      topic: trendingTopic.title,
      keywords: trendingTopic.keywords,
      targetWordCount: 1500,
      tone: 'professional',
      includeRegulatoryInfo: true
    });
    
    if (!blogResponse.data.success) {
      console.log('❌ Blog generation failed:', blogResponse.data.error);
      return;
    }

    console.log('✅ Blog generated successfully!');
    console.log(`📝 Title: ${blogResponse.data.blogPost.title}`);
    console.log(`📊 Word count: ${blogResponse.data.blogPost.wordCount}`);
    console.log(`⏱️ Reading time: ${blogResponse.data.blogPost.readingTime} minutes`);
    console.log(`🏷️ Keywords: ${blogResponse.data.blogPost.keywords.join(', ')}`);
    
    console.log('\n📄 Blog Content Preview:');
    console.log('='.repeat(60));
    console.log(blogResponse.data.blogPost.content.substring(0, 1200));
    console.log('='.repeat(60));

    // Generate DOCX and HTML versions
    console.log('\n4. Generating DOCX and HTML documents...');
    const docxResponse = await axios.post(`${BASE_URL}/blog-generator/generate-docx`, {
      topic: trendingTopic.title,
      keywords: trendingTopic.keywords,
      targetWordCount: 1500,
      tone: 'professional',
      includeRegulatoryInfo: true
    }, {
      responseType: 'arraybuffer'
    });

    if (docxResponse.status === 200) {
      console.log('✅ DOCX and HTML documents generated successfully!');
      console.log('📄 Both DOCX and HTML files are ready for download');
    } else {
     // console.log('❌ Document generation failed');
    }

    // Email the blog to marketing team
    console.log('\n5. Emailing blog to marketing team...');
    const emailResponse = await axios.post(`${BASE_URL}/blog-generator/generate-and-email`, {
      topic: trendingTopic.title,
      keywords: trendingTopic.keywords,
      targetWordCount: 1500,
      tone: 'professional',
      includeRegulatoryInfo: true
    });
    
    if (emailResponse.data.success) {
      console.log('✅ Email sent successfully to marketing team!');
      console.log('📧 Blog with DOCX and HTML attachments sent to marketing team');
      
      console.log('\n📄 Final Blog Summary:');
      console.log('='.repeat(60));
      console.log(`Title: ${blogResponse.data.blogPost.title}`);
      console.log(`Topic: ${blogResponse.data.blogPost.topic}`);
      console.log(`Word Count: ${blogResponse.data.blogPost.wordCount}`);
      console.log(`Reading Time: ${blogResponse.data.blogPost.readingTime} minutes`);
      console.log(`Keywords: ${blogResponse.data.blogPost.keywords.join(', ')}`);
      console.log(`Status: ${blogResponse.data.blogPost.status}`);
      console.log('='.repeat(60));
      
      console.log('\n🎉 Single blog generation completed successfully!');
      console.log('📬 Check your marketing team\'s email for the blog post with DOCX and HTML attachments.');
      
    } else {
      console.log('❌ Email sending failed:', emailResponse.data.error);
      console.log('\n💡 Email configuration tips:');
      console.log('   - Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS in .env');
      console.log('   - Set MARKETING_TEAM_EMAILS in .env');
      console.log('   - Example: MARKETING_TEAM_EMAILS=marketing@company.com,content@company.com');
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

// Run the single blog generation
generateSingleBlog(); 