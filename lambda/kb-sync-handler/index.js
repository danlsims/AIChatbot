const AWS = require('aws-sdk');

const bedrockAgent = new AWS.BedrockAgent();

const KB_ID = process.env.KB_ID;
const KB_DATA_SOURCE_ID_RAW = process.env.KB_DATA_SOURCE_ID;

// Extract just the data source ID (first part before comma)
const KB_DATA_SOURCE_ID = KB_DATA_SOURCE_ID_RAW ? KB_DATA_SOURCE_ID_RAW.split(',')[0] : null;

exports.handler = async (event) => {
    console.log('S3 Event received:', JSON.stringify(event, null, 2));
    
    try {
        // Process each S3 record
        for (const record of event.Records) {
            if (record.eventName.startsWith('ObjectCreated')) {
                const bucketName = record.s3.bucket.name;
                const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
                
                console.log(`File uploaded: ${objectKey} in bucket: ${bucketName}`);
                
                // Only sync for PDF files
                if (objectKey.toLowerCase().endsWith('.pdf')) {
                    console.log('Starting knowledge base sync for PDF file...');
                    
                    const syncParams = {
                        dataSourceId: KB_DATA_SOURCE_ID,
                        knowledgeBaseId: KB_ID
                    };

                    console.log('Sync parameters:', syncParams);
                    const syncResult = await bedrockAgent.startIngestionJob(syncParams).promise();
                    
                    console.log('Knowledge base sync started successfully:', {
                        ingestionJobId: syncResult.ingestionJob.ingestionJobId,
                        status: syncResult.ingestionJob.status,
                        triggeredBy: objectKey
                    });
                } else {
                    console.log(`Skipping sync for non-PDF file: ${objectKey}`);
                }
            }
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Knowledge base sync processing completed'
            })
        };
        
    } catch (error) {
        console.error('Error processing S3 event:', error);
        throw error; // This will cause the Lambda to retry
    }
};
