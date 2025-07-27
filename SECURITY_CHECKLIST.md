# 🔒 LinkStash 보안 체크리스트

## ✅ **즉시 완료해야 할 조치**

### **1. 노출된 키 교체 (최우선)**
- [ ] **Supabase anon key 재발급** (Dashboard > Settings > API)
- [ ] **Google API Key 재발급** (Google AI Studio)
- [ ] **새 키로 .env.local 업데이트**
- [ ] **Vercel Environment Variables 업데이트**

### **2. Git 히스토리 정리**
- [x] 민감한 파일 삭제 (`config/env-backup.txt`, `config/supabase-config.json`)
- [x] `.gitignore` 보안 패턴 추가
- [ ] **BFG Repo-Cleaner로 Git 히스토리 정리**
- [ ] **Force push로 원격 저장소 정리**

### **3. 팀 보안 교육**
- [ ] 팀원들에게 보안 이슈 공유
- [ ] 새로운 환경변수 설정 방법 공유
- [ ] Git pull/clone 재설정 안내

---

## 🛡️ **보안 모니터링**

### **정기 점검 항목**
- [ ] **월 1회**: Git 히스토리에서 민감한 정보 검색
- [ ] **월 1회**: 환경변수 파일 `.env*` 커밋 여부 확인
- [ ] **분기 1회**: API 키 로테이션
- [ ] **분기 1회**: 접근 권한 재검토

### **감지 명령어**
```bash
# Git에서 민감한 패턴 검색
git log --all -S "eyJhbGciOiJIUzI1NiI" --oneline
git log --all -S "AIza" --oneline  
git log --all -S "sk-" --oneline

# 현재 워킹 디렉토리에서 민감한 파일 검색
find . -name "*.env*" -not -path "./node_modules/*" -not -name ".env.example"
find . -name "*secret*" -o -name "*key*" -o -name "*token*" | grep -v node_modules
```

---

## 🚨 **보안 사고 대응 절차**

### **민감한 정보 노출 시**
1. **즉시 중단**: 추가 커밋/푸시 중지
2. **키 무효화**: 노출된 모든 API 키 즉시 재발급
3. **히스토리 정리**: BFG로 Git 히스토리에서 완전 제거
4. **팀 알림**: 모든 팀원에게 즉시 공지
5. **재설정**: 새로운 키로 모든 환경 재설정

### **의심스러운 접근 감지 시**
1. **로그 확인**: Supabase Dashboard에서 접근 로그 점검
2. **세션 무효화**: 모든 사용자 세션 강제 로그아웃
3. **키 교체**: 예방 차원에서 모든 API 키 교체
4. **모니터링 강화**: 24시간 접근 패턴 모니터링

---

## 📋 **개발 보안 가이드라인**

### **환경변수 관리**
- ✅ **허용**: `.env.example` (플레이스홀더만)
- ❌ **금지**: `.env`, `.env.local`, `.env.production`
- ✅ **사용**: Vercel Environment Variables
- ❌ **금지**: 코드 내 하드코딩

### **API 키 관리**
- ✅ **프론트엔드**: `NEXT_PUBLIC_*` (공개되어도 안전한 것만)
- ❌ **프론트엔드**: 서버사이드 API 키 노출 금지
- ✅ **백엔드**: 서버 환경변수에만 저장
- ✅ **로테이션**: 3개월마다 키 교체

### **Git 커밋 전 체크**
```bash
# 커밋 전 필수 실행
git diff --cached | grep -E "(API_KEY|SECRET|TOKEN|PASSWORD|eyJ|AIza|sk-)"
git status | grep -E "\.env|config.*\.(json|txt)$"
```

---

## 🔧 **자동화 보안 도구**

### **Pre-commit Hook 설정**
```bash
# .git/hooks/pre-commit 생성
#!/bin/bash
if git diff --cached --name-only | grep -E "\.(env|key|pem|p12)$"; then
    echo "❌ 민감한 파일이 커밋에 포함되어 있습니다!"
    exit 1
fi

if git diff --cached | grep -E "(eyJ|AIza|sk-|BEGIN.*PRIVATE|SECRET.*=)"; then
    echo "❌ 민감한 정보가 감지되었습니다!"
    exit 1
fi
```

### **GitHub Actions 보안 검사**
```yaml
# .github/workflows/security-check.yml
name: Security Check
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Check for secrets
        run: |
          if grep -r "eyJhbGciOiJIUzI1NiI" . --exclude-dir=node_modules; then
            echo "JWT token detected!"
            exit 1
          fi
```

---

## 📞 **비상 연락망**

- **보안 책임자**: [담당자 이메일]
- **Supabase 지원**: support@supabase.com
- **Google Cloud 지원**: https://cloud.google.com/support

---

## 📚 **참고 자료**

- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Supabase Security Guide](https://supabase.com/docs/guides/auth/managing-user-data)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)

---

**⚠️ 이 체크리스트를 정기적으로 검토하고 업데이트하세요!** 