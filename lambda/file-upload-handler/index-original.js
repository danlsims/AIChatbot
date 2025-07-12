const AWS = require('aws-sdk');

const s3 = new AWS.S3();
const bedrockAgent = new AWS.BedrockAgent();

const KB_BUCKET = process.env.KB_BUCKET;
const KB_ID = process.env.KB_ID;
const KB_DATA_SOURCE_ID_RAW = process.env.KB_DATA_SOURCE_ID;

// Extract just the data source ID (first part before comma)
const KB_DATA_SOURCE_ID = KB_DATA_SOURCE_ID_RAW ? KB_DATA_SOURCE_ID_RAW.split(',')[0] : null;

// Simple JWT validation (for demo purposes - in production, use proper JWT validation)
function validateToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
    }
    
    const token = authHeader.substring(7);
    // Basic check - token should be a JWT (has 3 parts separated by dots)
    const parts = token.split('.');
    return parts.length === 3;
}

// Simple multipart parser for file uploads
function parseMultipartData(body, contentType) {
    const boundary = contentType.split('boundary=')[1];
    if (!boundary) {
        throw new Error('No boundary found in content-type');
    }
    
    const parts = body.split(`--${boundary}`);
    
    for (const part of parts) {
        if (part.includes('Content-Disposition: form-data') && part.includes('filename=')) {
            // Extract filename
            const filenameMatch = part.match(/filename="([^"]+)"/);
            const filename = filenameMatch ? filenameMatch[1] : 'uploaded-file.pdf';
            
            // Extract content type
            const contentTypeMatch = part.match(/Content-Type: ([^\r\n]+)/);
            const fileContentType = contentTypeMatch ? contentTypeMatch[1] : 'application/pdf';
            
            // Extract file content (everything after the double CRLF)
            const contentStart = part.indexOf('\r\n\r\n');
            if (contentStart === -1) continue;
            
            const content = part.substring(contentStart + 4);
            // Remove trailing boundary markers
            const cleanContent = content.replace(/\r\n--.*$/, '');
            
            if (cleanContent.length > 0) {
                return {
                    filename,
                    contentType: fileContentType,
                    content: Buffer.from(cleanContent, 'binary')
                };
            }
        }
    }
    
    return null;
}

exports.handler = async (event) => {
    console.log('Event method:', event.httpMethod);
    console.log('Environment variables:', {
        KB_BUCKET,
        KB_ID,
        KB_DATA_SOURCE_ID_RAW,
        KB_DATA_SOURCE_ID
    });
    
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        // Validate authorization
        const authHeader = event.headers.Authorization || event.headers.authorization;
        if (!validateToken(authHeader)) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Unauthorized - Invalid or missing token' })
            };
        }

        // Get content type
        const contentType = event.headers['content-type'] || event.headers['Content-Type'];
        if (!contentType || !contentType.includes('multipart/form-data')) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Content-Type must be multipart/form-data' })
            };
        }

        // Parse multipart data
        console.log('Parsing multipart data with custom parser...');
        const file = parseMultipartData(event.body, contentType);
        
        if (!file) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: 'No file found in request',
                    debug: 'Make sure the form field name is "file" and a file is selected'
                })
            };
        }

        console.log('File parsed successfully:', {
            filename: file.filename,
            contentType: file.contentType,
            size: file.content.length
        });

        // Validate file type (only allow PDFs for PECARN documents)
        if (!file.filename.toLowerCase().endsWith('.pdf')) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Only PDF files are allowed' })
            };
        }

        // Upload file to S3 knowledge base bucket
        const uploadParams = {
            Bucket: KB_BUCKET,
            Key: file.filename,
            Body: file.content,
            ContentType: file.contentType,
            Metadata: {
                'uploaded-by': 'web-interface',
                'upload-timestamp': new Date().toISOString()
            }
        };

        console.log('Uploading file to S3:', file.filename);
        const uploadResult = await s3.upload(uploadParams).promise();
        console.log('File uploaded successfully:', uploadResult.Location);

        // Sync the knowledge base data source
        console.log('Starting knowledge base sync...');
        const syncParams = {
            dataSourceId: KB_DATA_SOURCE_ID,
            knowledgeBaseId: KB_ID
        };

        console.log('Sync parameters:', syncParams);
        const syncResult = await bedrockAgent.startIngestionJob(syncParams).promise();
        console.log('Knowledge base sync started:', syncResult.ingestionJob.ingestionJobId);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: 'File uploaded and knowledge base sync started successfully',
                fileName: file.filename,
                s3Location: uploadResult.Location,
                syncJobId: syncResult.ingestionJob.ingestionJobId,
                syncStatus: syncResult.ingestionJob.status
            })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to upload file or sync knowledge base',
                details: error.message 
            })
        };
    }
};
