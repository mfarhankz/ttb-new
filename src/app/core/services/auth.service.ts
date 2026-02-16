import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { API_CONFIG, DISABLE_MFA_IN_DEV } from '../config/api.config';
import { LoginRequest, LoginResponse, ApiError, LoginCredentials, RegisterPhoneMFARequest, VerifyOTPRequest, MFAResponse } from '../interfaces/api.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Authentication state
  private _isAuthenticated = signal<boolean>(false);
  private _responseData = signal<any>(null);
  
  // Store individual objects from data[0] for easy access
  private _tbUser = signal<any>(null);
  private _tbAddress = signal<any[]>([]);
  private _tbEmail = signal<any[]>([]);
  private _tbOffice = signal<any>(null);
  private _tbAssociation = signal<any>(null);
  private _tbLicense = signal<any>(null);
  private _tbPhone = signal<any[]>([]);
  
  // Public readonly signals
  public readonly isAuthenticated = this._isAuthenticated.asReadonly();
  public readonly responseData = this._responseData.asReadonly();
  public readonly tbUser = this._tbUser.asReadonly();
  public readonly tbAddress = this._tbAddress.asReadonly();
  public readonly tbEmail = this._tbEmail.asReadonly();
  public readonly tbOffice = this._tbOffice.asReadonly();
  public readonly tbAssociation = this._tbAssociation.asReadonly();
  public readonly tbLicense = this._tbLicense.asReadonly();
  public readonly tbPhone = this._tbPhone.asReadonly();

  // LocalStorage keys
  private readonly STORAGE_KEYS = {
    TOKEN: 'authToken',
    RESPONSE_DATA: 'responseData',
    TB_USER: 'TbUser',
    TB_ADDRESS: 'TbAddress',
    TB_EMAIL: 'TbEmail',
    TB_OFFICE: 'TbOffice',
    TB_ASSOCIATION: 'TbAssociation',
    TB_LICENSE: 'TbLicense',
    TB_PHONE: 'TbPhone',
    USER: 'user' // Backward compatibility
  };

  constructor(
    private router: Router,
    private apiService: ApiService
  ) {
    this.checkAuthStatus();
  }

  /**
   * Check if user is authenticated (helper method for guards)
   */
  isAuthenticatedValue(): boolean {
    return this._isAuthenticated();
  }

  /**
   * Check authentication status from storage
   */
  private checkAuthStatus(): void {
    const token = localStorage.getItem(this.STORAGE_KEYS.TOKEN);
    
    if (!token) {
      return;
    }

    this._isAuthenticated.set(true);
    
    // Restore responseData
    this.restoreFromStorage(this.STORAGE_KEYS.RESPONSE_DATA, (data) => {
      this._responseData.set(data);
    });
    
    // Restore all individual objects
    this.restoreFromStorage(this.STORAGE_KEYS.TB_USER, (data) => {
      this._tbUser.set(data);
    });
    
    this.restoreFromStorage(this.STORAGE_KEYS.TB_ADDRESS, (data) => {
      this._tbAddress.set(Array.isArray(data) ? data : []);
    });
    
    this.restoreFromStorage(this.STORAGE_KEYS.TB_EMAIL, (data) => {
      this._tbEmail.set(Array.isArray(data) ? data : []);
    });
    
    this.restoreFromStorage(this.STORAGE_KEYS.TB_OFFICE, (data) => {
      this._tbOffice.set(data);
    });
    
    this.restoreFromStorage(this.STORAGE_KEYS.TB_ASSOCIATION, (data) => {
      this._tbAssociation.set(data);
    });
    
    this.restoreFromStorage(this.STORAGE_KEYS.TB_LICENSE, (data) => {
      this._tbLicense.set(data);
    });
    
    this.restoreFromStorage(this.STORAGE_KEYS.TB_PHONE, (data) => {
      this._tbPhone.set(Array.isArray(data) ? data : []);
    });
  }

  /**
   * Helper method to restore data from localStorage
   */
  private restoreFromStorage(key: string, callback: (data: any) => void): void {
    try {
      const storedData = localStorage.getItem(key);
      if (storedData) {
        const restoredData = JSON.parse(storedData);
        callback(restoredData);
      }
    } catch (error) {
      console.error(`Error parsing stored data for ${key}:`, error);
    }
  }

  /**
   * Clear all authentication-related data from localStorage
   */
  private clearStorage(): void {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  /**
   * Login user
   * Accepts email/password and transforms to API format
   * Returns login response which may include MFA requirements
   */
  login(credentials: LoginCredentials): Observable<{ success: boolean; message?: string; requiresMFA?: boolean; mfaEnrolled?: boolean; phone?: string; email?: string; loginResponse?: any }> {
    const loginRequest: LoginRequest = {
      TbUser: {
        username: credentials.email,
        password: credentials.password
      }
    };

    return this.apiService.post<LoginResponse>(API_CONFIG.endpoints.login, loginRequest).pipe(
      map((apiResponse) => {
        // Clear all old data before processing new login
        this.clearStorage();

        const loginApiResponse = apiResponse as any;

        // Extract the data object - API response structure can vary
        // Possible structures:
        // 1. { data: { status, TTBSID, MFA_enrolled, phone, [0]: {...} } }
        // 2. { response: { data: { status, ... } } }
        // 3. Direct data object
        let responseData = loginApiResponse.data;
        
        // If wrapped in response object, unwrap it
        if (loginApiResponse.response && loginApiResponse.response.data) {
          responseData = loginApiResponse.response.data;
        }
        
        // If still no data, try direct access
        if (!responseData) {
          responseData = apiResponse.data || loginApiResponse;
        }
        
        // Log full response for debugging
        console.log('Login Response Structure:', {
          fullResponse: loginApiResponse,
          rawData: loginApiResponse.data,
          responseData: responseData,
          status: responseData?.status,
          TTBSID: responseData?.TTBSID,
          stk: responseData?.stk,
          MFA_enrolled: responseData?.MFA_enrolled,
          phone: responseData?.phone,
          email: responseData?.email,
          hasDataArray: responseData?.[0] !== undefined,
          allKeys: responseData ? Object.keys(responseData) : []
        });
        
        // Extract authentication token from response - API uses TTBSID (stored at data.TTBSID)
        // Also check for stk as fallback
        const authTokenFromApi = responseData?.TTBSID || responseData?.stk || loginApiResponse.TTBSID;

        // Extract user data from data[0] (user data is stored as array-like object at index 0)
        const userData = responseData?.[0] || responseData?.['0'];

        // Check for MFA requirement - ONLY if status === "MFA_required"
        // Response structure: { response: { status: "OK", data: { status: "MFA_required", ... } } }
        const mfaStatus = responseData?.status;
        const requiresMFA = mfaStatus === 'MFA_required';
        
        // Extract MFA-related fields from data object
        // MFA_enrolled is a boolean: true = phone already registered, false = need to register phone
        const mfaEnrolled = responseData?.MFA_enrolled === true || responseData?.MFA_enrolled === 'true' || responseData?.MFA_enrolled === 1;
        const phone = responseData?.phone || '';
        const email = responseData?.email || credentials.email;

        // Check if response explicitly indicates failure
        const hasLoginError = 
          apiResponse.success === false ||
          loginApiResponse.status === 'ERROR' ||
          responseData?.status === 'ERROR' ||
          loginApiResponse.error ||
          loginApiResponse.errors;

        // Check if MFA is required (status === "MFA_required")
        if (requiresMFA && authTokenFromApi) {
          // Check if MFA is disabled in development mode
          if (DISABLE_MFA_IN_DEV) {
            console.log('MFA disabled in development mode - completing login directly');
            
            // Store token
            localStorage.setItem(this.STORAGE_KEYS.TOKEN, authTokenFromApi);
            
            // Save user data and complete login
            if (userData) {
              this.saveUserData(userData);
              localStorage.setItem(this.STORAGE_KEYS.RESPONSE_DATA, JSON.stringify(responseData));
              this._responseData.set(responseData);
            }
            
            // Set authenticated state
            this._isAuthenticated.set(true);
            
            return {
              success: true,
              requiresMFA: false,
              message: 'Login successful'
            };
          }
          
          // MFA is required - proceed with MFA flow
          // Store the token for MFA API calls
          localStorage.setItem(this.STORAGE_KEYS.TOKEN, authTokenFromApi);
          
          // Log for debugging
          console.log('MFA Required - proceeding with MFA flow:', {
            status: mfaStatus,
            mfaEnrolled: mfaEnrolled,
            phone: phone,
            email: email
          });
          
          return {
            success: false,
            requiresMFA: true,
            mfaEnrolled: mfaEnrolled,
            phone: phone,
            email: email,
            loginResponse: loginApiResponse,
            message: mfaEnrolled ? 'Please enter your verification code' : 'Please register your phone for MFA'
          };
        }

        // No MFA required - complete login directly
        if (authTokenFromApi) {
          console.log('No MFA required - completing login directly');
          
          // Store token
          localStorage.setItem(this.STORAGE_KEYS.TOKEN, authTokenFromApi);
          
          // Save user data and complete login
          if (userData) {
            this.saveUserData(userData);
            localStorage.setItem(this.STORAGE_KEYS.RESPONSE_DATA, JSON.stringify(responseData));
            this._responseData.set(responseData);
          }
          
          // Set authenticated state
          this._isAuthenticated.set(true);
          
          return {
            success: true,
            requiresMFA: false,
            message: 'Login successful'
          };
        }
        
        // No token found - this is an error
        console.error('No token found in login response:', {
          mfaStatus,
          responseData,
          loginApiResponse
        });
        return {
          success: false,
          requiresMFA: false,
          message: 'Login failed. No authentication token received. Please try again.'
        };
      }),
      catchError((error: ApiError) => {
        return throwError(() => ({
          success: false,
          message: error.message || 'Login failed. Please check your credentials.'
        }));
      })
    );
  }

  /**
   * Save user data from the login API response
   * Extracts and stores TbUser, TbAddress, TbEmail, TbOffice, TbAssociation, TbLicense, and TbPhone
   */
  private saveUserData(userData: any): void {
    // Save TbUser object
    if (userData.TbUser) {
      this.saveToStorage(this.STORAGE_KEYS.TB_USER, userData.TbUser);
      this.saveToStorage(this.STORAGE_KEYS.USER, userData.TbUser); // Backward compatibility
      this._tbUser.set(userData.TbUser);
    }
    
    // Save array data
    if (Array.isArray(userData.TbAddress)) {
      this.saveToStorage(this.STORAGE_KEYS.TB_ADDRESS, userData.TbAddress);
      this._tbAddress.set(userData.TbAddress);
    }
    
    if (Array.isArray(userData.TbEmail)) {
      this.saveToStorage(this.STORAGE_KEYS.TB_EMAIL, userData.TbEmail);
      this._tbEmail.set(userData.TbEmail);
    }
    
    if (Array.isArray(userData.TbPhone)) {
      this.saveToStorage(this.STORAGE_KEYS.TB_PHONE, userData.TbPhone);
      this._tbPhone.set(userData.TbPhone);
    }
    
    // Save object data
    if (userData.TbOffice) {
      this.saveToStorage(this.STORAGE_KEYS.TB_OFFICE, userData.TbOffice);
      this._tbOffice.set(userData.TbOffice);
    }
    
    if (userData.TbAssociation) {
      this.saveToStorage(this.STORAGE_KEYS.TB_ASSOCIATION, userData.TbAssociation);
      this._tbAssociation.set(userData.TbAssociation);
    }
    
    if (userData.TbLicense) {
      this.saveToStorage(this.STORAGE_KEYS.TB_LICENSE, userData.TbLicense);
      this._tbLicense.set(userData.TbLicense);
    }
  }

  /**
   * Helper method to save data to localStorage
   */
  private saveToStorage(key: string, data: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving data to ${key}:`, error);
    }
  }

  /**
   * Logout user
   */
  logout(): void {
    this.clearStorage();
    
    // Reset all signals
    this._isAuthenticated.set(false);
    this._responseData.set(null);
    this._tbUser.set(null);
    this._tbAddress.set([]);
    this._tbEmail.set([]);
    this._tbOffice.set(null);
    this._tbAssociation.set(null);
    this._tbLicense.set(null);
    this._tbPhone.set([]);
    
    this.router.navigate(['/login']);
  }

  /**
   * Get user name from stored TbUser object
   */
  getUserName(): string | null {
    const tbUser = this._tbUser();
    return tbUser?.name || tbUser?.username || null;
  }

  /**
   * Register phone for MFA
   * Sends OTP to the provided phone number
   */
  registerPhoneMFA(request: RegisterPhoneMFARequest): Observable<MFAResponse> {
    // Get TTBSID from localStorage (stored during login)
    const ttbsid = localStorage.getItem(this.STORAGE_KEYS.TOKEN);
    
    // Add TTBSID as query parameter
    const queryParams = ttbsid ? { TTBSID: ttbsid } : undefined;
    
    return this.apiService.post<MFAResponse>(API_CONFIG.endpoints.sendMfaOtp, request, queryParams).pipe(
      map((response: any) => {
        const mfaResponse = response.response || response;
        if (mfaResponse.status === 'OK') {
          return mfaResponse;
        } else {
          // Extract error message from response
          const errorMsg = mfaResponse.data?.[0] || mfaResponse.data?.message || mfaResponse.message || 'Failed to send OTP';
          throw new Error(typeof errorMsg === 'string' ? errorMsg : errorMsg.message || 'Failed to send OTP');
        }
      }),
      catchError((error: ApiError) => {
        return throwError(() => ({
          message: error.message || 'Failed to send verification code. Please try again.'
        }));
      })
    );
  }

  /**
   * Verify OTP code
   * Verifies the OTP and completes the login process
   */
  verifyOTP(request: VerifyOTPRequest): Observable<{ success: boolean; loginResponse?: any; message?: string }> {
    // Get TTBSID from localStorage (stored during login)
    const ttbsid = localStorage.getItem(this.STORAGE_KEYS.TOKEN);
    
    // Add TTBSID as query parameter
    const queryParams = ttbsid ? { TTBSID: ttbsid } : undefined;
    
    return this.apiService.post<any>(API_CONFIG.endpoints.verifyMfaOtp, request, queryParams).pipe(
      map((response: any) => {
        const verifyResponse = response.response || response;
        
        console.log('OTP Verification Response:', {
          fullResponse: response,
          verifyResponse: verifyResponse,
          status: verifyResponse.status,
          data: verifyResponse.data
        });
        
        if (verifyResponse.status === 'OK') {
          // OTP verified successfully, now complete the login
          // The response structure is: { response: { status: 'OK', data: [{ TbUser, TbAddress, ... }], TTBSID: '...' } }
          const responseData = verifyResponse.data;
          
          // Extract token from verified response (may be in data object or at root)
          const authToken = verifyResponse.TTBSID || verifyResponse.data?.TTBSID || ttbsid;
          
          if (authToken) {
            localStorage.setItem(this.STORAGE_KEYS.TOKEN, authToken);
            this._isAuthenticated.set(true);
          }

          // Extract user data from data[0] (same structure as login response)
          const userData = responseData?.[0] || responseData?.['0'] || responseData;
          
          if (userData) {
            // Save all user data (TbUser, TbAddress, etc.)
            this.saveUserData(userData);
            
            // Store the complete response data
            localStorage.setItem(this.STORAGE_KEYS.RESPONSE_DATA, JSON.stringify(responseData));
            this._responseData.set(responseData);
          }

          return { success: true, loginResponse: verifyResponse };
        } else {
          // Extract error message from response
          const errorMsg = verifyResponse.data?.[0] || verifyResponse.data?.message || verifyResponse.message || 'Invalid verification code';
          throw new Error(typeof errorMsg === 'string' ? errorMsg : errorMsg.message || 'Invalid verification code');
        }
      }),
      catchError((error: ApiError) => {
        return throwError(() => ({
          success: false,
          message: error.message || 'Invalid verification code. Please try again.'
        }));
      })
    );
  }
}
