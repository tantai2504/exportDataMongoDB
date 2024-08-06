// const dbURI = 'mongodb+srv://salesbay:7hT1KKp02C8Vz4J3@sbay.vgcgzxf.mongodb.net/sbayfinal2_workplace?retryWrites=true&w=majority';

const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const mongoose = require('mongoose');

// Kết nối với MongoDB
const dbURI =
	'mongodb+srv://salesbay:7hT1KKp02C8Vz4J3@sbay.vgcgzxf.mongodb.net/sbayfinal_workplace?retryWrites=true&w=majority';
	const localURL = "mongodb://localhost:27017/sbay_workplace";
mongoose.connect(localURL, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

// Lấy tên cơ sở dữ liệu từ URI
// const dbName = 'sbayfinal2_workplace';

function exportData() {
	mongoose.connection.once('open', async () => {
		console.log('Connected to MongoDB');

		try {
			// Lấy danh sách tất cả các collection trong cơ sở dữ liệu
			const collections = await mongoose.connection.db
				.listCollections()
				.toArray();

			// Tạo thư mục 'exports' để lưu các file JSON nếu chưa tồn tại
			const exportDir = path.join(__dirname, 'exports');
			await fs.ensureDir(exportDir);

			// Lặp qua từng collection và xuất dữ liệu ra file JSON
			for (const collection of collections) {
				const collectionName = collection.name;
				const filePath = path.join(exportDir, `${collectionName}.json`);

				// Tạo lệnh mongoexport
				const command = `mongoexport --uri="${dbURI}" --collection=${collectionName} --out="${filePath}" --jsonArray`;

				// Thực thi lệnh mongoexport
				exec(command, (error, stdout, stderr) => {
					if (error) {
						console.error(`Error exporting ${collectionName}:`, error);
						return;
					}
					if (stderr) {
						console.error(`Stderr while exporting ${collectionName}:`, stderr);
						return;
					}
					console.log(`Exported ${collectionName} to ${filePath}`);
				});
			}

			console.log('All collections have been exported.');
		} catch (error) {
			console.error('Error exporting collections:', error);
		} finally {
			mongoose.connection.close();
		}
	});
}

// exportData();

function importData() {
	mongoose.connection.once('open', async () => {
		console.log('Connected to MongoDB');
	  
		try {
		  // Đường dẫn tới thư mục chứa các tệp JSON
		  const importDir = path.join(__dirname, 'exports');
	  
		  // Lấy danh sách tất cả các tệp JSON trong thư mục
		  const files = await fs.readdir(importDir);
	  
		  // Lặp qua từng tệp JSON và nhập dữ liệu vào MongoDB
		  for (const file of files) {
			const collectionName = path.basename(file, path.extname(file)); // Lấy tên collection từ tên tệp
			const filePath = path.join(importDir, file);
	  
			// Tạo lệnh mongoimport
			const command = `mongoimport --uri="${localURL}" --collection=${collectionName} --file="${filePath}" --jsonArray`;
	  
			// Thực thi lệnh mongoimport với kích thước bộ đệm lớn hơn
			exec(command, { maxBuffer: 1024 * 500 }, (error, stdout, stderr) => { // 500KB buffer
			  if (error) {
				console.error(`Error importing ${collectionName}:`, error);
				return;
			  }
			  if (stderr) {
				console.error(`Stderr while importing ${collectionName}:`, stderr);
				return;
			  }
			  console.log(`Imported ${collectionName} from ${filePath}`);
			});
		  }
	  
		  console.log('All collections have been imported.');
		} catch (error) {
		  console.error('Error importing collections:', error);
		} finally {
		  mongoose.connection.close();
		}
	  });
}

importData();