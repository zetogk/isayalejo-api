const AWS = require('aws-sdk');
const fs = require('fs');

const {
    AWS_S3_ACCESS_KEY_ID,
    AWS_S3_SECRET_ACCESS_KEY,
    AWS_S3_BUCKET_NAME
} = process.env;

const s3 = new AWS.S3({
    accessKeyId: AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: AWS_S3_SECRET_ACCESS_KEY
});

const uploadFile = async (path, name, isPrivate = true) => {

    const fileContent = fs.readFileSync(path);
    console.log('fileContent::: ', fileContent);

    const private = isPrivate ? 'private' : 'public-read';

    const params = {
        Bucket: AWS_S3_BUCKET_NAME,
        Key: name,
        Body: fileContent,
        ACL: private
    };

    const data = await uploadFileToAws(params);

    return data.Location;

};

module.exports = {
    uploadFile
}

const uploadFileToAws = (params) => {

    return new Promise((resolve, reject) => {

        try {

            s3.upload(params, (err, data) => {
        
                if (err) {
                    console.error('Error uploading data: ', err.message);
                    reject(err.message);
                }
        
                resolve(data)
        
            });
            
        } catch (err) {

            console.error('Error in uploadFileToAws: ', err.message);
            
        }

    })

}
