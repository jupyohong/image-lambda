const sharp = require("sharp");
const aws = require("aws-sdk");
const s3 = new aws.S3();

const resizeOptions = [
  { name: "w140", width: 140 },
  { name: "w600", width: 600 },
];

exports.handler = async (event) => {
  try {
    const Key = event.Records[0].s3.object.key;
    const keyOnly = Key.split("/")[1];
    const image = await s3
      .getObject({ Bucket: "image-upload-test-coconutsilo", Key })
      .promise();
    await Promise.all(
      resizeOptions.map(async ({ name, width }) => {
        const newKey = `${name}/${keyOnly}`;
        const resizedImage = await sharp(image.Body)
          .rotate() // preserve original images' rotation
          .resize(width)
          .toBuffer();
        await s3
          .putObject({
            Bucket: "image-upload-test-coconutsilo",
            Body: resizedImage,
            Key: newKey,
          })
          .promise();
      })
    );

    return {
      statusCode: 200,
      body: event,
    };
  } catch (err) {}
};
