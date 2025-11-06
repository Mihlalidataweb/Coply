const { ethers } = require('hardhat');
require('dotenv').config();

async function main() {
  console.log('Starting deployment...');

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);
  console.log('Account balance:', (await deployer.getBalance()).toString());

  // Deploy MosaicNFT contract
  console.log('\n1. Deploying MosaicNFT contract...');
  const MosaicNFT = await ethers.getContractFactory('MosaicNFT');
  const mosaicNFT = await MosaicNFT.deploy();

  await mosaicNFT.deployed();
  console.log('MosaicNFT deployed to:', mosaicNFT.address);
  console.log('Transaction hash:', mosaicNFT.deployTransaction.hash);

  // Deploy MosaicFactory contract
  console.log('\n2. Deploying MosaicFactory contract...');
  const MosaicFactory = await ethers.getContractFactory('MosaicFactory');
  const mosaicFactory = await MosaicFactory.deploy(mosaicNFT.address);

  await mosaicFactory.deployed();
  console.log('MosaicFactory deployed to:', mosaicFactory.address);
  console.log('Transaction hash:', mosaicFactory.deployTransaction.hash);

  // Set up factory permissions
  console.log('\n3. Setting up factory permissions...');
  const transferTx = await mosaicNFT.transferOwnership(mosaicFactory.address);
  await transferTx.wait();
  console.log('MosaicNFT ownership transferred to factory');

  // Verify deployment
  console.log('\n4. Verifying deployment...');
  console.log('MosaicNFT owner:', await mosaicNFT.owner());
  console.log('MosaicFactory owner:', await mosaicFactory.owner());

  // Create a test mosaic (optional)
  console.log('\n5. Creating test mosaic...');
  try {
    const testImages = Array(30).fill('QmTest123'); // Placeholder CIDs
    const testMosaicCID = 'QmMosaicTest123';
    const testTx = await mosaicFactory.createMosaic(
      'Test Mosaic',
      'A test mosaic created during deployment',
      testImages,
      testMosaicCID,
      0, // Grid pattern
      250 // 2.5% royalty
    );
    await testTx.wait();
    console.log('Test mosaic created successfully');
  } catch (error) {
    console.log('Test mosaic creation failed (this is expected on test networks):', error.message);
  }

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    contracts: {
      MosaicNFT: {
        address: mosaicNFT.address,
        deploymentHash: mosaicNFT.deployTransaction.hash,
      },
      MosaicFactory: {
        address: mosaicFactory.address,
        deploymentHash: mosaicFactory.deployTransaction.hash,
      },
    },
    deployedAt: new Date().toISOString(),
  };

  // Write to deployment file
  const fs = require('fs');
  const path = require('path');
  const deploymentDir = path.join(__dirname, '..', 'deployments');

  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentDir, `${hre.network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log('\n✅ Deployment completed successfully!');
  console.log('📄 Deployment info saved to:', deploymentFile);
  console.log('\nContract addresses:');
  console.log('  MosaicNFT:', mosaicNFT.address);
  console.log('  MosaicFactory:', mosaicFactory.address);

  // Update frontend config
  console.log('\n6. Updating frontend configuration...');
  const frontendConfigPath = path.join(__dirname, '..', 'frontend', 'src', 'config', 'contracts.json');
  const configDir = path.dirname(frontendConfigPath);

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const frontendConfig = {
    [hre.network.name]: {
      MosaicNFT: mosaicNFT.address,
      MosaicFactory: mosaicFactory.address,
    },
  };

  fs.writeFileSync(frontendConfigPath, JSON.stringify(frontendConfig, null, 2));
  console.log('Frontend config updated:', frontendConfigPath);

  console.log('\n🎉 All done! Your Mosaic NFT contracts are ready to use.');
}

// Error handling
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Deployment failed:', error);
    process.exit(1);
  });