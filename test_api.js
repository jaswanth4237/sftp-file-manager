async function runTests() {
  const baseUrl = 'http://localhost:3000/api/sftp';
  
  console.log("--- Testing List ---");
  const listRes = await fetch(`${baseUrl}/list?path=/upload`);
  const listData = await listRes.json();
  console.log("List Result (First item):", listData[0]);

  console.log("\n--- Testing Download ---");
  const dlRes = await fetch(`${baseUrl}/download?path=/upload/test-file.txt`);
  const dlData = await dlRes.text();
  console.log("Download Content Response:", dlData.substring(0, 50));

  console.log("\n--- Testing Health ---");
  const healthRes = await fetch('http://localhost:3000/api/health');
  console.log("Health Status:", (await healthRes.json()).status);
}

runTests().catch(err => console.error("Test failed:", err));
