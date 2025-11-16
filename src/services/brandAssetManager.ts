/**
 * Brand Asset Manager Service
 * 
 * Manages retrieval and caching of brand assets (logos, mascots, etc.)
 * for image generation. Handles:
 * - Logo download from URLs
 * - File caching for performance
 * - Content type detection
 * - Cache invalidation
 */

import { BrandDataExtractor, BrandAssets } from './brandDataExtractor';
import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';

interface CachedLogo {
  profile_id: string;
  logo_url: string;
  local_path: string;
  downloaded_at: Date;
  file_size: number;
  content_type: string;
  etag?: string;
  expires_at: Date;
}

interface LogoFileResult {
  type: 'url' | 'buffer' | 'file_path';
  value: string | Buffer;
  content_type?: string;
  filename?: string;
}

export interface AssetManagerOptions {
  prefer_url?: boolean; // Pass URL if image generator supports
  download_if_needed?: boolean; // Download if URL not supported
  use_cache?: boolean; // Use cached file if available
  cache_ttl_days?: number; // Cache time-to-live in days (default: 7)
}

export class BrandAssetManager {
  private static readonly CACHE_DIR = path.join(process.cwd(), 'tmp', 'brand-assets');
  private static readonly DEFAULT_CACHE_TTL_DAYS = 7;
  
  /**
   * Initialize cache directory
   */
  private static async ensureCacheDir(): Promise<void> {
    try {
      await fs.mkdir(this.CACHE_DIR, { recursive: true });
    } catch (error: any) {
      console.error('Failed to create cache directory:', error.message);
    }
  }
  
  /**
   * Get logo file for image generation
   * Tries multiple strategies: URL, cached file, download
   * 
   * @param brandProfileId Brand profile ID
   * @param options Asset manager options
   * @returns Logo file result or null
   */
  static async getLogoFile(
    brandProfileId: string,
    options: AssetManagerOptions = {}
  ): Promise<LogoFileResult | null> {
    const {
      prefer_url = false,
      download_if_needed = true,
      use_cache = true,
      cache_ttl_days = this.DEFAULT_CACHE_TTL_DAYS,
    } = options;
    
    try {
      // Get brand assets
      const assets = await BrandDataExtractor.extractBrandAssets(brandProfileId);
      
      if (!assets.logo_url) {
        console.warn('⚠️ No logo URL found for brand profile:', brandProfileId);
        return null;
      }
      
      // Strategy 1: Return URL if preferred and supported
      if (prefer_url) {
        console.log('✅ Using logo URL (preferred):', assets.logo_url);
        return {
          type: 'url',
          value: assets.logo_url,
        };
      }
      
      // Strategy 2: Check cache
      if (use_cache) {
        const cached = await this.getCachedLogo(brandProfileId, assets.logo_url, cache_ttl_days);
        if (cached) {
          console.log('✅ Using cached logo file:', cached.local_path);
          const buffer = await fs.readFile(cached.local_path);
          return {
            type: 'buffer',
            value: buffer,
            content_type: cached.content_type,
            filename: path.basename(cached.local_path),
          };
        }
      }
      
      // Strategy 3: Download on-demand
      if (download_if_needed) {
        try {
          console.log('📥 Downloading logo from URL:', assets.logo_url);
          const buffer = await BrandDataExtractor.downloadLogo(assets.logo_url);
          const content_type = await this.detectContentType(assets.logo_url, buffer);
          
          // Cache it if caching is enabled
          if (use_cache) {
            await this.cacheLogo(brandProfileId, assets.logo_url, buffer, content_type, cache_ttl_days);
          }
          
          console.log('✅ Logo downloaded successfully');
          return {
            type: 'buffer',
            value: buffer,
            content_type,
            filename: `brand-logo.${this.getExtensionFromContentType(content_type)}`,
          };
        } catch (downloadError: any) {
          console.error('❌ Failed to download logo:', downloadError.message);
          // Fallback to URL
          console.log('⚠️ Falling back to logo URL');
          return {
            type: 'url',
            value: assets.logo_url,
          };
        }
      }
      
      // If all strategies failed, return URL as last resort
      return {
        type: 'url',
        value: assets.logo_url,
      };
    } catch (error: any) {
      console.error('❌ Error getting logo file:', error.message);
      return null;
    }
  }
  
  /**
   * Get cached logo if available and valid
   * 
   * @param profileId Brand profile ID
   * @param logoUrl Logo URL (for validation)
   * @param ttlDays Cache TTL in days
   * @returns Cached logo metadata or null
   */
  private static async getCachedLogo(
    profileId: string,
    logoUrl: string,
    ttlDays: number
  ): Promise<CachedLogo | null> {
    try {
      await this.ensureCacheDir();
      
      const cacheDir = path.join(this.CACHE_DIR, profileId);
      const metadataPath = path.join(cacheDir, 'logo_metadata.json');
      
      if (!existsSync(metadataPath)) {
        return null;
      }
      
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      const metadata: CachedLogo = JSON.parse(metadataContent);
      
      // Validate cache
      if (metadata.logo_url !== logoUrl) {
        console.log('⚠️ Cached logo URL mismatch, invalidating cache');
        await this.clearCache(profileId);
        return null;
      }
      
      if (!existsSync(metadata.local_path)) {
        console.log('⚠️ Cached logo file missing, invalidating cache');
        await this.clearCache(profileId);
        return null;
      }
      
      // Check expiration
      const expiresAt = new Date(metadata.expires_at);
      if (new Date() > expiresAt) {
        console.log('⚠️ Cached logo expired, invalidating cache');
        await this.clearCache(profileId);
        return null;
      }
      
      return metadata;
    } catch (error: any) {
      console.warn('⚠️ Error reading cache:', error.message);
      return null;
    }
  }
  
  /**
   * Cache logo file
   * 
   * @param profileId Brand profile ID
   * @param logoUrl Logo URL
   * @param buffer Logo file buffer
   * @param contentType Content type
   * @param ttlDays Cache TTL in days
   */
  private static async cacheLogo(
    profileId: string,
    logoUrl: string,
    buffer: Buffer,
    contentType: string,
    ttlDays: number
  ): Promise<void> {
    try {
      await this.ensureCacheDir();
      
      const cacheDir = path.join(this.CACHE_DIR, profileId);
      await fs.mkdir(cacheDir, { recursive: true });
      
      const extension = this.getExtensionFromContentType(contentType);
      const logoPath = path.join(cacheDir, `logo.${extension}`);
      const metadataPath = path.join(cacheDir, 'logo_metadata.json');
      
      // Save logo file
      await fs.writeFile(logoPath, buffer);
      
      // Save metadata
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + ttlDays);
      
      const metadata: CachedLogo = {
        profile_id: profileId,
        logo_url: logoUrl,
        local_path: logoPath,
        downloaded_at: new Date(),
        file_size: buffer.length,
        content_type: contentType,
        expires_at: expiresAt,
      };
      
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      
      console.log('✅ Logo cached successfully:', logoPath);
    } catch (error: any) {
      console.error('❌ Error caching logo:', error.message);
      // Don't throw - caching is optional
    }
  }
  
  /**
   * Clear cache for a brand profile
   * 
   * @param profileId Brand profile ID
   */
  static async clearCache(profileId: string): Promise<void> {
    try {
      const cacheDir = path.join(this.CACHE_DIR, profileId);
      if (existsSync(cacheDir)) {
        await fs.rm(cacheDir, { recursive: true, force: true });
        console.log('✅ Cache cleared for profile:', profileId);
      }
    } catch (error: any) {
      console.error('❌ Error clearing cache:', error.message);
    }
  }
  
  /**
   * Detect content type from URL or buffer
   * 
   * @param url Logo URL
   * @param buffer Logo buffer (optional)
   * @returns Content type
   */
  private static async detectContentType(url: string, buffer?: Buffer): Promise<string> {
    // Try to detect from URL extension
    const urlLower = url.toLowerCase();
    if (urlLower.endsWith('.png')) return 'image/png';
    if (urlLower.endsWith('.jpg') || urlLower.endsWith('.jpeg')) return 'image/jpeg';
    if (urlLower.endsWith('.svg')) return 'image/svg+xml';
    if (urlLower.endsWith('.webp')) return 'image/webp';
    if (urlLower.endsWith('.gif')) return 'image/gif';
    
    // Try to detect from buffer magic bytes
    if (buffer) {
      if (buffer[0] === 0x89 && buffer[1] === 0x50) return 'image/png'; // PNG
      if (buffer[0] === 0xFF && buffer[1] === 0xD8) return 'image/jpeg'; // JPEG
      if (buffer[0] === 0x47 && buffer[1] === 0x49) return 'image/gif'; // GIF
      if (buffer[0] === 0x52 && buffer[1] === 0x49) return 'image/webp'; // WebP
    }
    
    // Default to PNG
    return 'image/png';
  }
  
  /**
   * Get file extension from content type
   * 
   * @param contentType Content type
   * @returns File extension (without dot)
   */
  private static getExtensionFromContentType(contentType: string): string {
    const mapping: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/svg+xml': 'svg',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };
    
    return mapping[contentType.toLowerCase()] || 'png';
  }
  
  /**
   * Get all cached assets for a brand profile
   * 
   * @param profileId Brand profile ID
   * @returns Array of cached asset paths
   */
  static async getCachedAssets(profileId: string): Promise<string[]> {
    try {
      const cacheDir = path.join(this.CACHE_DIR, profileId);
      if (!existsSync(cacheDir)) {
        return [];
      }
      
      const files = await fs.readdir(cacheDir);
      return files
        .filter(file => file !== 'logo_metadata.json')
        .map(file => path.join(cacheDir, file));
    } catch (error: any) {
      console.error('❌ Error getting cached assets:', error.message);
      return [];
    }
  }
  
  /**
   * Clean up expired cache entries
   * 
   * @returns Number of cleaned entries
   */
  static async cleanupExpiredCache(): Promise<number> {
    try {
      await this.ensureCacheDir();
      
      const entries = await fs.readdir(this.CACHE_DIR);
      let cleaned = 0;
      
      for (const entry of entries) {
        const entryPath = path.join(this.CACHE_DIR, entry);
        const metadataPath = path.join(entryPath, 'logo_metadata.json');
        
        if (existsSync(metadataPath)) {
          try {
            const metadataContent = await fs.readFile(metadataPath, 'utf-8');
            const metadata: CachedLogo = JSON.parse(metadataContent);
            
            if (new Date() > new Date(metadata.expires_at)) {
              await fs.rm(entryPath, { recursive: true, force: true });
              cleaned++;
            }
          } catch (error) {
            // Skip invalid entries
          }
        }
      }
      
      if (cleaned > 0) {
        console.log(`✅ Cleaned up ${cleaned} expired cache entries`);
      }
      
      return cleaned;
    } catch (error: any) {
      console.error('❌ Error cleaning up cache:', error.message);
      return 0;
    }
  }
}

