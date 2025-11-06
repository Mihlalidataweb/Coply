import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { Web3State, NetworkType } from '@/types';

interface ContractConfig {
  address: string;
  abi: any;
}

interface NetworkConfig {
  chainId: string;
  chainName: string;
  rpcUrls: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorerUrls?: string[];
}

// Network configurations
const NETWORKS: Record<NetworkType, NetworkConfig> = {
  ethereum: {
    chainId: '0x1',
    chainName: 'Ethereum Mainnet',
    rpcUrls: ['https://mainnet.infura.io/v3/'],
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrls: ['https://etherscan.io'],
  },
  polygon: {
    chainId: '0x89',
    chainName: 'Polygon Mainnet',
    rpcUrls: ['https://polygon-rpc.com/'],
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    blockExplorerUrls: ['https://polygonscan.com'],
  },
  arbitrum: {
    chainId: '0xa4b1',
    chainName: 'Arbitrum One',
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrls: ['https://arbiscan.io'],
  },
};

// Test networks
const TEST_NETWORKS: Record<NetworkType, NetworkConfig> = {
  ethereum: {
    chainId: '0xaa36a7', // Sepolia
    chainName: 'Sepolia Testnet',
    rpcUrls: ['https://sepolia.infura.io/v3/'],
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
  },
  polygon: {
    chainId: '0x13881', // Mumbai
    chainName: 'Mumbai Testnet',
    rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    blockExplorerUrls: ['https://mumbai.polygonscan.com'],
  },
  arbitrum: {
    chainId: '0x66eee', // Arbitrum Sepolia
    chainName: 'Arbitrum Sepolia',
    rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrls: ['https://sepolia.arbiscan.io'],
  },
};

export const useWeb3 = () => {
  const [state, setState] = useState<Web3State>({
    account: null,
    provider: null,
    signer: null,
    network: 'ethereum',
    isConnected: false,
    isConnecting: false,
    balance: '0',
  });

  const [isTestnet, setIsTestnet] = useState(false);

  // Check if wallet is available
  const isWalletAvailable = useMemo(() => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  }, []);

  // Get current network config
  const getNetworkConfig = useCallback((networkType: NetworkType, testnet: boolean = false): NetworkConfig => {
    return testnet ? TEST_NETWORKS[networkType] : NETWORKS[networkType];
  }, []);

  // Switch network
  const switchNetwork = useCallback(async (networkType: NetworkType, testnet: boolean = false) => {
    if (!window.ethereum) throw new Error('MetaMask not installed');

    const networkConfig = getNetworkConfig(networkType, testnet);
    const chainId = networkConfig.chainId;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
    } catch (error: any) {
      // Network doesn't exist, add it
      if (error.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [networkConfig],
        });
      } else {
        throw error;
      }
    }

    setState(prev => ({ ...prev, network: networkType }));
  }, [getNetworkConfig]);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (!isWalletAvailable) {
      throw new Error('MetaMask or compatible wallet not found');
    }

    setState(prev => ({ ...prev, isConnecting: true }));

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const balance = await provider.getBalance(accounts[0]);
      const network = await provider.getNetwork();

      // Determine network type
      let networkType: NetworkType = 'ethereum';
      const chainId = `0x${network.chainId.toString(16)}`;

      if (chainId === NETWORKS.polygon.chainId || chainId === TEST_NETWORKS.polygon.chainId) {
        networkType = 'polygon';
      } else if (chainId === NETWORKS.arbitrum.chainId || chainId === TEST_NETWORKS.arbitrum.chainId) {
        networkType = 'arbitrum';
      }

      const testnet = chainId !== NETWORKS.ethereum.chainId &&
                    chainId !== NETWORKS.polygon.chainId &&
                    chainId !== NETWORKS.arbitrum.chainId;

      setIsTestnet(testnet);

      setState({
        account: accounts[0],
        provider,
        signer,
        network: networkType,
        isConnected: true,
        isConnecting: false,
        balance: ethers.formatEther(balance),
      });

      return accounts[0];
    } catch (error) {
      setState(prev => ({ ...prev, isConnecting: false }));
      throw error;
    }
  }, [isWalletAvailable]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setState({
      account: null,
      provider: null,
      signer: null,
      network: 'ethereum',
      isConnected: false,
      isConnecting: false,
      balance: '0',
    });
  }, []);

  // Get contract instance
  const getContract = useCallback((config: ContractConfig) => {
    if (!state.signer) {
      throw new Error('Wallet not connected');
    }

    return new ethers.Contract(config.address, config.abi, state.signer);
  }, [state.signer]);

  // Estimate gas for transaction
  const estimateGas = useCallback(async (
    contract: ContractConfig,
    methodName: string,
    args: any[] = []
  ) => {
    if (!state.provider) {
      throw new Error('Provider not available');
    }

    const contractInstance = getContract(contract);
    const gasEstimate = await contractInstance[methodName].estimateGas(...args);
    const gasPrice = await state.provider.getFeeData();

    return {
      gasLimit: gasEstimate,
      gasPrice: gasPrice.gasPrice,
      maxFeePerGas: gasPrice.maxFeePerGas,
      maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
    };
  }, [state.provider, getContract]);

  // Send transaction
  const sendTransaction = useCallback(async (
    contract: ContractConfig,
    methodName: string,
    args: any[] = [],
    options: any = {}
  ) => {
    if (!state.signer) {
      throw new Error('Wallet not connected');
    }

    const contractInstance = getContract(contract);

    try {
      const gasEstimate = await estimateGas(contract, methodName, args);

      const tx = await contractInstance[methodName](...args, {
        gasLimit: gasEstimate.gasLimit,
        ...options,
      });

      return tx;
    } catch (error: any) {
      // Handle user rejection
      if (error.code === 4001) {
        throw new Error('Transaction rejected by user');
      }
      // Handle insufficient funds
      if (error.code === -32603 && error.message.includes('insufficient funds')) {
        throw new Error('Insufficient funds for transaction');
      }
      throw error;
    }
  }, [state.signer, getContract, estimateGas]);

  // Get transaction receipt
  const getTransactionReceipt = useCallback(async (txHash: string) => {
    if (!state.provider) {
      throw new Error('Provider not available');
    }

    return await state.provider.getTransactionReceipt(txHash);
  }, [state.provider]);

  // Wait for transaction
  const waitForTransaction = useCallback(async (txHash: string, confirmations: number = 1) => {
    if (!state.provider) {
      throw new Error('Provider not available');
    }

    return await state.provider.waitForTransaction(txHash, confirmations);
  }, [state.provider]);

  // Get current gas price
  const getGasPrice = useCallback(async () => {
    if (!state.provider) {
      throw new Error('Provider not available');
    }

    const feeData = await state.provider.getFeeData();
    return feeData;
  }, [state.provider]);

  // Update balance
  const updateBalance = useCallback(async () => {
    if (!state.account || !state.provider) return;

    try {
      const balance = await state.provider.getBalance(state.account);
      setState(prev => ({
        ...prev,
        balance: ethers.formatEther(balance),
      }));
    } catch (error) {
      console.error('Error updating balance:', error);
    }
  }, [state.account, state.provider]);

  // Listen for account changes
  useEffect(() => {
    if (!isWalletAvailable) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== state.account) {
        // Account changed, reconnect
        connectWallet();
      }
    };

    const handleChainChanged = () => {
      // Chain changed, reconnect
      connectWallet();
    };

    const handleDisconnect = () => {
      disconnectWallet();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('disconnect', handleDisconnect);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
      window.ethereum?.removeListener('disconnect', handleDisconnect);
    };
  }, [isWalletAvailable, state.account, connectWallet, disconnectWallet]);

  // Auto-connect on mount
  useEffect(() => {
    if (isWalletAvailable) {
      // Check if already connected
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            connectWallet();
          }
        })
        .catch(() => {
          // Silently fail
        });
    }
  }, [isWalletAvailable, connectWallet]);

  // Update balance periodically
  useEffect(() => {
    if (state.isConnected) {
      updateBalance();
      const interval = setInterval(updateBalance, 10000); // Update every 10 seconds
      return () => clearInterval(interval);
    }
  }, [state.isConnected, updateBalance]);

  return {
    // State
    ...state,
    isTestnet,

    // Methods
    connectWallet,
    disconnectWallet,
    switchNetwork,

    // Contract methods
    getContract,
    estimateGas,
    sendTransaction,
    getTransactionReceipt,
    waitForTransaction,

    // Utilities
    getGasPrice,
    updateBalance,
    isWalletAvailable,
    getNetworkConfig,
  };
};