# 🚀 LinkStash 개발 가이드라인

## 📋 **커밋 및 배포 규칙**

### **🔄 작은 변경사항 처리 규칙**

#### **한 줄짜리 변경사항 (Minor Changes)**
- **정의**: CSS 값 조정, 텍스트 수정, 간단한 스타일 변경 등
- **처리 방식**: **10개씩 모아서 커밋 및 배포**
- **커밋 메시지**: `🎨 Minor UI improvements batch #N`

#### **예시 - 한 줄짜리 변경사항들:**
```bash
# 1. 버튼 패딩 4px → 6px
# 2. 텍스트 색상 조정
# 3. 마진 간격 미세 조정  
# 4. 폰트 굵기 변경
# 5. 호버 효과 조정
# 6. 아이콘 크기 변경
# 7. 간격 통일
# 8. 그림자 효과 조정
# 9. 테두리 반경 변경
# 10. 투명도 조정

→ 10개 완료시 일괄 커밋 및 배포
```

### **🚀 중간 규모 변경사항 (Medium Changes)**
- **정의**: 새로운 컴포넌트 추가, 기능 개선, 여러 파일 수정
- **처리 방식**: **즉시 커밋 및 배포**
- **커밋 메시지**: 기능별 명확한 설명

### **🛡️ 대규모 변경사항 (Major Changes)**
- **정의**: 보안 수정, 구조 변경, 새로운 기능 전체
- **처리 방식**: **즉시 커밋 및 배포 + 별도 문서화**
- **커밋 메시지**: 상세한 변경사항 기록

---

## 📝 **커밋 메시지 컨벤션**

### **타입별 이모지 사용**
- 🎨 **UI/스타일**: `🎨 Minor UI improvements batch #1`
- ✨ **새 기능**: `✨ Add reading calendar component`
- 🐛 **버그 수정**: `🐛 Fix email verification issue`
- 🔒 **보안**: `🔒 Security improvements and fixes`
- 📝 **문서**: `📝 Update development guidelines`
- 🚀 **배포**: `🚀 Deploy batch improvements`
- 🔧 **설정**: `🔧 Update environment configuration`

### **배치 커밋 번호 관리**
```bash
# 배치 번호는 순차적으로 증가
🎨 Minor UI improvements batch #1
🎨 Minor UI improvements batch #2
🎨 Minor UI improvements batch #3
```

---

## 🔄 **개발 워크플로우**

### **1. 변경사항 분류**
```bash
# 변경사항 확인
git status
git diff

# 분류 기준:
# - 1줄 변경 → 배치 대기열에 추가
# - 여러 줄/파일 → 즉시 처리
# - 보안/중요 → 최우선 처리
```

### **2. 배치 대기열 관리**
```bash
# 임시 커밋으로 작업 저장
git add .
git commit -m "WIP: batch item #X - description"

# 10개 완료시 스쿼시 커밋
git reset --soft HEAD~10
git add .
git commit -m "🎨 Minor UI improvements batch #1

- Button padding adjustments (4px → 6px)
- Text color optimizations  
- Margin spacing improvements
- Font weight refinements
- Hover effect enhancements
- Icon size standardization
- Gap consistency updates
- Shadow effect tweaks
- Border radius adjustments
- Opacity fine-tuning"
```

### **3. 자동화된 배포**
```bash
# 커밋 후 자동 배포
git push origin main

# Vercel 자동 배포 확인
# 약 2-3분 후 배포 완료
```

---

## 📊 **배치 추적 시스템**

### **배치 상태 추적**
```markdown
## 현재 배치 상태: #3

### 대기 중인 변경사항 (7/10):
- [ ] 1. 버튼 호버 색상 조정
- [ ] 2. 카드 간격 2px 증가  
- [ ] 3. 제목 폰트 크기 조정
- [ ] 4. 그림자 투명도 변경
- [ ] 5. 입력 필드 패딩 조정
- [ ] 6. 아이콘 정렬 개선
- [ ] 7. 테두리 색상 통일
- [ ] 8. [대기]
- [ ] 9. [대기]  
- [ ] 10. [대기]

### 완료된 배치:
- ✅ Batch #1: UI spacing improvements (10/10)
- ✅ Batch #2: Color scheme adjustments (10/10)
```

---

## 🛠️ **도구 및 스크립트**

### **배치 관리 스크립트**
```bash
# 배치 상태 확인
./scripts/check-batch-status.sh

# 배치 커밋 생성
./scripts/create-batch-commit.sh

# 자동 배포
./scripts/deploy-batch.sh
```

### **VS Code 설정**
```json
{
  "git.inputValidation": "always",
  "git.inputValidationLength": 72,
  "git.inputValidationSubjectLength": 50
}
```

---

## 🚨 **예외 상황 처리**

### **긴급 수정 (Hotfix)**
- **규칙 무시**: 배치 대기 중이라도 즉시 커밋/배포
- **우선순위**: 보안 > 버그 > 기능 > 스타일

### **배치 중단 조건**
- 보안 이슈 발견
- 중요 버그 발견  
- 클라이언트 긴급 요청
- 의존성 업데이트 필요

---

## 📈 **성과 측정**

### **배포 효율성 지표**
- **배포 빈도**: 주 2-3회 → 주 1-2회 목표
- **커밋 품질**: 의미있는 단위로 그룹화
- **롤백 빈도**: 최소화 (배치 테스트 강화)

### **월간 리뷰**
- 배치 처리 효과성 검토
- 워크플로우 개선점 파악
- 규칙 업데이트 필요성 검토

---

## 🔗 **관련 문서**

- [SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md) - 보안 관련 지침
- [README.md](./README.md) - 프로젝트 개요
- [VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md) - 배포 설정

---

**⚡ 효율적인 개발을 위해 이 가이드라인을 준수해주세요!** 