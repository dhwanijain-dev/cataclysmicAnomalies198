const fs = require('fs');
const xml2js = require('xml2js');

async function debugXMLParsing() {
  try {
    // Read the XML file
    const xmlContent = fs.readFileSync('./public/ufdrFIles/testUfdr1.xml', 'utf8');
    console.log('XML Content length:', xmlContent.length);
    
    // Parse the XML
    const parser = new xml2js.Parser({
      explicitArray: true,
      mergeAttrs: false,
      explicitCharkey: false,
      attrkey: '$',
      charkey: '_',
      ignoreAttrs: false,
    });
    
    const xmlData = await parser.parseStringPromise(xmlContent);
    
    console.log('\n=== XML STRUCTURE DEBUG ===');
    console.log('Root keys:', Object.keys(xmlData));
    
    if (xmlData.UFDR_Report) {
      console.log('UFDR_Report keys:', Object.keys(xmlData.UFDR_Report));
      
      // Check Chats section
      if (xmlData.UFDR_Report.Chats) {
        console.log('Chats section exists:', !!xmlData.UFDR_Report.Chats);
        console.log('Chats section type:', Array.isArray(xmlData.UFDR_Report.Chats) ? 'array' : typeof xmlData.UFDR_Report.Chats);
        console.log('Chats section length:', xmlData.UFDR_Report.Chats.length);
        
        if (xmlData.UFDR_Report.Chats[0]) {
          console.log('Chats[0] keys:', Object.keys(xmlData.UFDR_Report.Chats[0]));
          
          if (xmlData.UFDR_Report.Chats[0].Conversation) {
            console.log('Conversations found:', xmlData.UFDR_Report.Chats[0].Conversation.length);
            
            // Look at first conversation
            const firstConv = xmlData.UFDR_Report.Chats[0].Conversation[0];
            console.log('First conversation structure:', Object.keys(firstConv));
            console.log('First conversation attributes:', firstConv.$);
            
            if (firstConv.Message) {
              console.log('Messages in first conversation:', firstConv.Message.length);
              console.log('First message structure:', Object.keys(firstConv.Message[0]));
              console.log('First message content:', firstConv.Message[0]);
            }
          }
        }
      }
      
      // Check Communications section
      if (xmlData.UFDR_Report.Communications) {
        console.log('Communications section exists');
        console.log('Communications structure:', Object.keys(xmlData.UFDR_Report.Communications[0]));
        
        if (xmlData.UFDR_Report.Communications[0].Messages) {
          console.log('Messages section exists');
          console.log('Messages structure:', Object.keys(xmlData.UFDR_Report.Communications[0].Messages[0]));
          
          if (xmlData.UFDR_Report.Communications[0].Messages[0].Message) {
            const messages = xmlData.UFDR_Report.Communications[0].Messages[0].Message;
            console.log('Found messages:', messages.length);
            console.log('First message structure:', Object.keys(messages[0]));
            console.log('First message content:', messages[0]);
          }
        }
        
        if (xmlData.UFDR_Report.Communications[0].Calls) {
          console.log('Calls section exists');
          const calls = xmlData.UFDR_Report.Communications[0].Calls[0].Call;
          console.log('Found calls:', calls.length);
        }
      } else {
        console.log('Communications section does NOT exist');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugXMLParsing();