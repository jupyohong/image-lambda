const aws = require("aws-sdk");
const sharp = require("sharp");
const s3 = new aws.S3();

exports.handler = async (event) => {
  try {
    // console.log(
    //   "Reading options from event:\n",
    //   util.inspect(event, { depth: 5 })
    // );
    const srcBucket = event.Records[0].s3.bucket.name;
    const srcKey = decodeURIComponent(
      event.Records[0].s3.object.key.replace(/\+/g, " ")
    );
    // 리사이즈 여부 확인
    const folder = srcKey.split("/")[0];
    if (!["beverage", "profile"].includes(folder)) {
      return;
    }

    const dstBucket = srcBucket + "-resized";

    // S3 원본 버켓에서 이미지 가져오기
    const params = {
      Bucket: srcBucket,
      Key: srcKey,
    };
    const srcImage = await s3.getObject(params).promise();

    // 이미지 리사이즈
    const resizeOptions = [
      { name: "w250", width: 250 },
      { name: "w500", width: 500 },
    ];

    await Promise.all(
      resizeOptions.map(async ({ name, width }) => {
        try {
          const dstKey = `${name}/${srcKey}`;
          const buffer = await sharp(srcImage.Body)
            .rotate() // 원본 이미지 회전값 유지
            .resize({ width, height: width, fit: "outside" })
            .toBuffer();
          const dstParams = {
            Bucket: dstBucket,
            Key: dstKey,
            Body: buffer,
            ContentType: "image",
          };
          await s3.putObject(dstParams).promise();
        } catch (err) {
          throw err;
        }
      })
    );
    console.log("Successfully resized " + srcBucket + "/" + srcKey);
    return;
  } catch (err) {
    console.error(err);
    return;
  }
};
