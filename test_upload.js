async function testUpload() {
  const formData = new FormData();
  formData.append('path', '/upload');
  formData.append('file', new Blob(['hello world'], { type: 'text/plain' }), 'hello.txt');

  const res = await fetch('http://localhost:3000/api/sftp/upload', {
    method: 'POST',
    body: formData
  });

  const data = await res.json();
  console.log("Upload Result:", data);
}

testUpload().catch(console.error);
