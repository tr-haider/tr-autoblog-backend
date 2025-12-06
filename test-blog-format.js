const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testBlogFormat() {
  console.log('🤖 AutoBlog AI - Testing Blog Format and Structure...\n');

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

    // Generate a blog with proper formatting
    console.log('\n2. Generating blog with proper formatting...');
    const blogResponse = await axios.post(`${BASE_URL}/blog-generator/generate`, {
      topic: 'Implementing HIPAA-Compliant AI Solutions in Healthcare',
      keywords: ['HIPAA compliance', 'AI in healthcare', 'healthcare software', 'data security', 'regulatory compliance'],
      targetWordCount: 1200,
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
    
    console.log('\n📄 FULL BLOG CONTENT:');
    console.log('='.repeat(80));
    console.log(blogResponse.data.blogPost.content);
    console.log('='.repeat(80));

    // Check for HTML structure
    const content = blogResponse.data.blogPost.content;
    const hasH1 = content.includes('<h1>');
    const hasH2 = content.includes('<h2>');
    const hasH3 = content.includes('<h3>');
    const hasParagraphs = content.includes('<p>');
    const hasLists = content.includes('<ul>') || content.includes('<ol>');
    const hasLinks = content.includes('<a href=');
    const hasBold = content.includes('<strong>');

    console.log('\n🔍 HTML STRUCTURE ANALYSIS:');
    console.log(`✅ H1 tags: ${hasH1 ? 'Yes' : 'No'}`);
    console.log(`✅ H2 tags: ${hasH2 ? 'Yes' : 'No'}`);
    console.log(`✅ H3 tags: ${hasH3 ? 'Yes' : 'No'}`);
    console.log(`✅ Paragraph tags: ${hasParagraphs ? 'Yes' : 'No'}`);
    console.log(`✅ List tags: ${hasLists ? 'Yes' : 'No'}`);
    console.log(`✅ Link tags: ${hasLinks ? 'Yes' : 'No'}`);
    console.log(`✅ Bold tags: ${hasBold ? 'Yes' : 'No'}`);

    // Count sections
    const h2Count = (content.match(/<h2>/g) || []).length;
    const h3Count = (content.match(/<h3>/g) || []).length;
    const paragraphCount = (content.match(/<p>/g) || []).length;
    const listCount = (content.match(/<ul>|<ol>/g) || []).length;

    console.log('\n📊 CONTENT STATISTICS:');
    console.log(`📝 H2 sections: ${h2Count}`);
    console.log(`📝 H3 subsections: ${h3Count}`);
    console.log(`📝 Paragraphs: ${paragraphCount}`);
    console.log(`📝 Lists: ${listCount}`);

    console.log('\n🎉 Blog format test completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the blog format test
testBlogFormat(); 