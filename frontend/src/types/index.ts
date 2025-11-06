export interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  name: string;
  size: number;
  type: string;
  position?: {
    x: number;
    y: number;
  };
  rotation?: number;
  scale?: number;
  cropped?: boolean;
}

export interface MosaicPattern {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface MosaicDraft {
  id: string;
  name: string;
  images: UploadedImage[];
  pattern: MosaicPattern;
  createdAt: number;
  lastModified: number;
  thumbnail?: string;
}

export interface MosaicMetadata {
  name: string;
  description: string;
  category?: string;
  tags?: string[];
  royaltyPercentage?: number;
}

export type NetworkType = 'ethereum' | 'polygon' | 'arbitrum';

export interface Web3State {
  account: string | null;
  provider: any;
  signer: any;
  network: NetworkType;
  isConnected: boolean;
  isConnecting: boolean;
  balance: string;
}

export interface IPFSUploadResult {
  cid: string;
  url: string;
  size: number;
}

export interface MosaicGenerationOptions {
  tileSize: number;
  spacing: number;
  opacity: number;
  borderWidth: number;
  borderColor: string;
  blendMode: GlobalCompositeOperation;
}