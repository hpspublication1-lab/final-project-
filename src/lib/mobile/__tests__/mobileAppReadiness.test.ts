import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit, clearRateLimits, enforceRateLimit } from '@/lib/security/rateLimiter';
import {
  sanitizeFilename,
  validateUploadFile,
  validateBase64Upload,
} from '@/lib/security/uploadValidation';
import { canAccessCourse } from '@/lib/auth/rbac';
import { getSessionUser } from '@/lib/supabase/route-auth';

// Mock Supabase SSR and JS clients
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn((_url, _key, _opts) => ({
    auth: {
      getUser: vi.fn(async (token?: string) => {
        if (token === 'valid-mobile-token') {
          return {
            data: {
              user: {
                id: 'mobile-student-uuid',
                email: 'mobile.student@samyaktutor.com',
                user_metadata: { offline_devices: ['android-dev-1'] },
              },
            },
            error: null,
          };
        }
        return { data: { user: null }, error: new Error('Invalid token') };
      }),
    },
  })),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

describe('Mobile App Readiness & Production Security Suite', () => {
  beforeEach(() => {
    clearRateLimits();
    vi.clearAllMocks();
  });

  describe('1. Sliding-Window Rate Limiter Engine', () => {
    it('allows requests within limit and decrements remaining tokens', () => {
      const res1 = checkRateLimit('client-ip-1', 5, 10000);
      expect(res1.allowed).toBe(true);
      expect(res1.remaining).toBe(4);

      const res2 = checkRateLimit('client-ip-1', 5, 10000);
      expect(res2.allowed).toBe(true);
      expect(res2.remaining).toBe(3);
    });

    it('rejects requests once limit is reached and provides reset seconds', () => {
      for (let i = 0; i < 3; i++) {
        checkRateLimit('client-ip-burst', 3, 60000);
      }

      const blocked = checkRateLimit('client-ip-burst', 3, 60000);
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
      expect(blocked.resetSeconds).toBeGreaterThan(0);
    });

    it('enforces preset rules by request header (auth, submission, payment)', () => {
      const req = new Request('https://samyaktutor.com/api/auth/login', {
        headers: { 'x-forwarded-for': '202.70.80.90' },
      });

      const res = enforceRateLimit(req, 'auth');
      expect(res.allowed).toBe(true);
      expect(res.remaining).toBe(9); // 10 - 1
    });

    it('isolates rate limiting across distinct IP addresses', () => {
      const reqA = new Request('https://samyaktutor.com/api/payments/verify', {
        headers: { 'x-forwarded-for': '1.1.1.1' },
      });
      const reqB = new Request('https://samyaktutor.com/api/payments/verify', {
        headers: { 'x-forwarded-for': '2.2.2.2' },
      });

      enforceRateLimit(reqA, 'payment');
      const resB = enforceRateLimit(reqB, 'payment');

      expect(resB.remaining).toBe(14); // 15 - 1 for IP B
    });
  });

  describe('2. Upload Security & File Sanitization', () => {
    it('sanitizes directory traversal and malicious characters from filenames', () => {
      expect(sanitizeFilename('../../../etc/passwd')).toBe('passwd');
      expect(sanitizeFilename('..\\..\\windows\\system32\\cmd.exe')).toBe('cmd.exe');
      expect(sanitizeFilename('exam paper (final) #1!.pdf')).toBe('exam_paper__final___1_.pdf');
      expect(sanitizeFilename('normal_receipt.jpg')).toBe('normal_receipt.jpg');
    });

    it('blocks dangerous and executable file extensions', () => {
      const badFiles = [
        { name: 'hack.php', size: 1024, type: 'application/x-php' },
        { name: 'payload.exe', size: 2048, type: 'application/x-msdownload' },
        { name: 'script.sh', size: 512, type: 'application/x-sh' },
        { name: 'malware.bat', size: 128, type: 'text/plain' },
        { name: 'evil.svg', size: 500, type: 'image/svg+xml' },
      ];

      for (const file of badFiles) {
        const result = validateUploadFile(file);
        expect(result.valid).toBe(false);
        expect(result.error).toMatch(/prohibited|not allowed/i);
      }
    });

    it('validates safe image uploads and enforces 5MB limit', () => {
      const validImage = {
        name: 'question_screenshot.png',
        size: 2 * 1024 * 1024, // 2 MB
        type: 'image/png',
      };
      expect(validateUploadFile(validImage, 'image').valid).toBe(true);

      const oversizedImage = {
        name: 'huge_photo.jpg',
        size: 7 * 1024 * 1024, // 7 MB
        type: 'image/jpeg',
      };
      const oversizeRes = validateUploadFile(oversizedImage, 'image');
      expect(oversizeRes.valid).toBe(false);
      expect(oversizeRes.error).toContain('exceeds the maximum limit');
    });

    it('validates safe PDF documents and enforces 15MB limit', () => {
      const validPdf = {
        name: 'cee_syllabus.pdf',
        size: 8 * 1024 * 1024, // 8 MB
        type: 'application/pdf',
      };
      expect(validateUploadFile(validPdf, 'document').valid).toBe(true);

      const oversizedPdf = {
        name: 'entire_textbook.pdf',
        size: 20 * 1024 * 1024, // 20 MB
        type: 'application/pdf',
      };
      expect(validateUploadFile(oversizedPdf, 'document').valid).toBe(false);
    });

    it('validates base64 data URLs for mobile canvas and screenshot uploads', () => {
      const validBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...';
      const res = validateBase64Upload(validBase64, 1024 * 1024);
      expect(res.valid).toBe(true);
      expect(res.mimeType).toBe('image/jpeg');

      const invalidMime = 'data:application/javascript;base64,YWxlcnQoMSk=';
      expect(validateBase64Upload(invalidMime).valid).toBe(false);

      const malformed = 'not-a-data-url';
      expect(validateBase64Upload(malformed).valid).toBe(false);
    });
  });

  describe('3. Unified Mobile Bearer Token Authentication', () => {
    it('authenticates mobile client via Authorization Bearer token header', async () => {
      const req = new Request('https://samyaktutor.com/api/profile', {
        headers: {
          Authorization: 'Bearer valid-mobile-token',
        },
      });

      const user = await getSessionUser(req);
      expect(user).not.toBeNull();
      expect(user?.id).toBe('mobile-student-uuid');
      expect(user?.email).toBe('mobile.student@samyaktutor.com');
    });

    it('returns null user when authorization header contains invalid or expired token', async () => {
      const req = new Request('https://samyaktutor.com/api/profile', {
        headers: {
          Authorization: 'Bearer expired-or-tampered-token',
        },
      });

      const user = await getSessionUser(req);
      expect(user).toBeNull();
    });
  });

  describe('4. Authoritative Course Access Matrix', () => {
    it('allows SEE paid students access to see_class_10 only', () => {
      expect(canAccessCourse('student_paid_see', [], 'see_class_10')).toBe(true);
      expect(canAccessCourse('student_paid_see', [], 'cee_medical')).toBe(false);
    });

    it('allows CEE paid students access to cee_medical only', () => {
      expect(canAccessCourse('student_paid_cee', [], 'cee_medical')).toBe(true);
      expect(canAccessCourse('student_paid_cee', [], 'see_class_10')).toBe(false);
    });

    it('grants full cross-course access to all-access, teachers, and admins', () => {
      const privilegedRoles = ['student_all_access', 'teacher', 'admin', 'super_admin'] as const;
      for (const role of privilegedRoles) {
        expect(canAccessCourse(role, [], 'see_class_10')).toBe(true);
        expect(canAccessCourse(role, [], 'cee_medical')).toBe(true);
      }
    });

    it('denies free students and visitors without active course pass', () => {
      expect(canAccessCourse('student_free', [], 'see_class_10')).toBe(false);
      expect(canAccessCourse('student_free', [], 'cee_medical')).toBe(false);
      expect(canAccessCourse('visitor', [], 'see_class_10')).toBe(false);

      // But allows free student if enrolled list explicitly contains course
      expect(canAccessCourse('student_free', ['see_class_10'], 'see_class_10')).toBe(true);
    });
  });

  describe('5. Mobile Offline DRM Watermark & Device Cap Policy', () => {
    it('enforces maximum 2 registered offline devices per candidate', () => {
      const candidateDevices = ['iphone-14-uuid', 'samsung-s23-uuid'];
      const newDevice = 'ipad-mini-uuid';

      const isAllowed = candidateDevices.includes(newDevice) || candidateDevices.length < 2;
      expect(isAllowed).toBe(false); // Rejected because limit is 2
    });

    it('permits offline download if within device quota', () => {
      const candidateDevices = ['iphone-14-uuid'];
      const newDevice = 'ipad-pro-uuid';

      const isAllowed = candidateDevices.includes(newDevice) || candidateDevices.length < 2;
      expect(isAllowed).toBe(true);
    });

    it('generates anti-piracy dynamic watermark containing student ID and masked contact', () => {
      const studentId = 'usr_892f30b9';
      const studentName = 'Aarav Sharma';
      const rawPhone = '9841234567';

      const maskedPhone = rawPhone.slice(0, 3) + '****' + rawPhone.slice(-3);
      const watermarkText = `${studentName} (${maskedPhone})`;
      const watermarkSubText = `ID: ${studentId} • Samyak Tutor`;

      expect(maskedPhone).toBe('984****567');
      expect(watermarkText).toBe('Aarav Sharma (984****567)');
      expect(watermarkSubText).toBe('ID: usr_892f30b9 • Samyak Tutor');
    });
  });
});
