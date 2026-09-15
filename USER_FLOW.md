# 🧭 유미당(Yumidang) 종합 유저 플로우 (User Flow)

> **서비스 정의**: 취향 맞는 이웃과 안전하고 부담 없이 만나는 **1:1 실시간 동행 매칭 및 라이프스타일 플랫폼**  
> **핵심 원칙**: 엄격한 1:1 단일 락(Single Lock) 매칭, D-day 리마인드, 안심 대시보드, 상호 블라인드 당도 평가

---

## 1. 🗺️ 전체 하이레벨 유저 저니 (End-to-End User Journey)

```mermaid
flowchart TD
    Start([앱 접속]) --> AuthCheck{로그인 여부}
    
    %% 비회원 / 미로그인
    AuthCheck -- 미로그인 --> GuestBrowse[홈/둘러보기 탐색 가능]
    GuestBrowse --> LoginTrigger{동행 신청 / 글쓰기 시도}
    LoginTrigger --> AuthFlow[전화번호 본인인증 & 가입]
    
    %% 로그인 회원
    AuthCheck -- 로그인 완료 --> Home[홈 화면]
    AuthFlow --> Home
    
    Home --> NavChoice{주요 탭 탐색}
    
    %% 탭별 분기
    NavChoice -->|Home| AIEvent[AI 주차별 이벤트 & 카테고리]
    NavChoice -->|U| FeedView[1:1 동행 피드 둘러보기]
    NavChoice -->|Chat| ChatList[1:1 매칭 채팅방]
    NavChoice -->|Me| MyPageView[마이페이지 & 동행 관리]
    NavChoice -->|+ 버튼| CreateMeetup[1:1 동행 공고 등록]
    
    %% 매칭 및 동행 완결 플로우
    FeedView --> PostDetail[동행 상세 확인]
    PostDetail --> ApplyJoin[1:1 동행 신청]
    ApplyJoin --> HostDecision{호스트 수락 여부}
    
    HostDecision -- 수락 (Single Lock) --> MatchConfirmed[매칭 확정 2/2명]
    MatchConfirmed --> DDayCard[홈 상단 D-7 리마인드 노출]
    DDayCard --> Dashboard[약속 참여 대시보드]
    
    Dashboard --> OnSiteActions[비밀장소 확인 / 안심통화 / 도착알림]
    OnSiteActions --> ReviewStep[상호 블라인드 당도 평가]
    ReviewStep --> Complete([동행 완료 & 당도 정산])
```

---

## 2. 📱 상세 기능별 세부 유저 플로우

### Flow 1. 회원가입 & 본인인증 (Auth & KYC Flow)
사용자의 진입 장벽을 최소화하되, 신원 검증과 성별 맞춤 정책을 철저히 적용합니다.

```mermaid
sequenceDiagram
    autonumber
    actor User as 사용자
    participant App as 앱 클라이언트
    participant Auth as Supabase Auth & KYC

    User->>App: 로그인 모달 진입
    Note over App: 기존 번호 로그인 우선 노출 (11자리 입력 제한)
    alt 기존 회원 로그인
        User->>App: 휴대폰 번호 입력 (최대 11자리) & 인증번호 입력
        App->>Auth: SMS OTP 검증
        Auth-->>App: 로그인 성공 (기존 프로필 복원)
    else 신규 가입
        User->>App: '휴대폰 본인인증으로 가입' 클릭
        User->>App: 성명(한글 자모 분리 방지), 성별, 생년월일, 전화번호 입력
        alt 남성 가입자인 경우
            Note over App: 추천인 코드 필수 입력 검증
            User->>App: 추천인 코드 입력
        end
        User->>App: 프로필 사진 등록 (5MB 이하 파일 / 기본 아바타)
        App->>Auth: 회원가입 및 프로필 생성
        Auth-->>App: 가입 완료 (이름 가운데 글자 자동 마스킹: 홍*동)
    end
    opt 신분증 / 1원 계좌 실명 KYC 인증
        User->>App: 마이페이지에서 안심 KYC 인증 시작
        App->>Auth: 신분증 진위확인 / 1원 계좌 예금주 검증
        Auth-->>App: KYC 인증 뱃지 활성화
    end
```

---

### Flow 2. 홈 탐색 및 AI 문화 이벤트 큐레이션 (Explore & Event Flow)
홈 화면에서 주차별 주요 문화 행사(팝업, 전시, 축제, 공연)를 직관적으로 탐색합니다.

```mermaid
flowchart LR
    HomeBanner[메인 홈 이벤트 배너] -->|자동 필터링| ThisWeek[현재 주차 시작 이벤트 우선 노출<br/>예: 9월 2주차]
    ThisWeek --> Indicator[하단 게이지 바 인디케이터]
    
    HomeBanner -->|전체보기 클릭| AllModal[이벤트 전체보기 모달<br/>EventAllViewModal]
    
    AllModal --> WeekFilter{주차 필터 선택}
    WeekFilter -->|1주차| PastEvents[종료된 이벤트: 회색 흑백 딤드 + 종료 뱃지]
    WeekFilter -->|2주차| CurrentEvents[이번주 진행중 이벤트: 컬러풀 + 진행중 뱃지]
    WeekFilter -->|3~4주차| FutureEvents[오픈 예정 이벤트: 사전 동행 모집]
    
    AllModal --> CategoryFilter[팝업 / 전시 / 축제 / 공연 카테고리 필터]
    AllModal --> CardClick[이벤트 카드 클릭]
    CardClick --> DetailModal[이벤트 상세 & 관련 1:1 모임 리스트]
```

---

### Flow 3. 카테고리 피드 탐색 & '지금이당!' 실시간 급만남 (Category Flow)
12개 그리드 카테고리 중 최상단 1순위에 '지금'을 배치하여 즉시 번개 만남을 지원합니다.

```mermaid
flowchart TD
    Grid[12개 카테고리 그리드]
    
    Grid --> CatNow[1행 1열: '지금' (당! 아이콘)]
    Grid --> CatExhibition[2. 전시]
    Grid --> CatFestival[3. 축제]
    Grid --> CatDining[4. 식사]
    Grid --> CatEtc[12. '기타' (MoreHorizontal 아이콘)]
    
    CatNow -->|클릭| NowFeedModal[지금이당! 전용 피드 모달]
    NowFeedModal --> NowHeader[헤더/배너: '지금 바로 만나는 지금이당! ⚡']
    NowHeader --> NowPosts[오늘/지금 만나는 1:1 급만남 공고]
    
    CatEtc -->|클릭| EtcFeedModal[기타 동행 피드 모달]
    EtcFeedModal --> EtcPosts[보드게임, 취미 등 이색 1:1 동행 공고]
    
    CatExhibition --> ExhibitionPosts[전시 동행 공고]
```

---

### Flow 4. 1:1 동행 공고 등록 (Host Flow)
호스트가 1:1 원칙을 준수하는 공고를 개설합니다.

```mermaid
flowchart TD
    Trigger([하단 중앙 + 버튼 클릭]) --> CheckLogin{로그인 여부}
    CheckLogin -- No --> AuthModal[로그인 팝업 노출]
    CheckLogin -- Yes --> Form[동행 모집 작성 폼]
    
    Form --> Step1[12개 카테고리 선택<br/>지금, 전시, 축제, ..., 기타]
    Step1 --> Step2[제목 및 동행 소개 입력]
    Step2 --> Step3[일시 및 1:1 인원 확인<br/>최대 인원 2명 고정]
    Step3 --> Step4[만남 장소 이원화 설정]
    
    Step4 --> LocPublic[공개 만남 장소<br/>모든 사용자에게 공개]
    Step4 --> LocSecret[비밀 만남 장소<br/>매칭 확정 파트너에게만 D-day 공개]
    
    Step4 --> Step5[동행 유형 선택]
    Step5 --> TypeFree[무료 일반 동행]
    Step5 --> TypePro[유료 프로 동행<br/>시간당 비용 & 에스크로 결제 설정]
    
    Step5 --> Submit[등록 완료]
    Submit --> FeedUpdate[둘러보기 및 홈 피드에 실시간 반영]
```

---

### Flow 5. 1:1 신청 & 단일 락(Single Lock) 매칭 확정 (Join & Match Flow)
유미당만의 핵심 차별점인 **단일 락(Single Lock)** 메커니즘을 통해 다자간 혼선을 원천 방지합니다.

```mermaid
sequenceDiagram
    autonumber
    actor Guest as 게스트 (신청자)
    participant Feed as 탐색 피드
    actor Host as 호스트 (작성자)
    participant System as 매칭 엔진 (Single Lock)
    participant Chat as 1:1 채팅

    Guest->>Feed: 동행 상세 공고 확인 (1/2명 모집중)
    Guest->>Feed: '1:1 동행 신청하기' 클릭
    Guest->>Feed: 신청 메시지 & 기대 사항 작성
    Feed->>System: 동행 신청 등록 (Status: pending)
    System-->>Host: 🔔 실시간 알림 전송 ("새로운 동행 신청 도착")
    
    Note over Host: Me 탭 [동행 신청 받은 건] 또는 알림함에서 확인
    Host->>System: 신청자 프로필(당도, 리뷰, 소개) 검토
    
    alt 호스트가 수락(Accept)한 경우
        Host->>System: 수락 버튼 클릭
        critical 단일 락(Single Lock) 작동
            System->>System: 선택된 게스트 신청 Status -> 'accepted'
            System->>System: 동일 공고의 다른 모든 신청 Status -> 'rejected'
            System->>System: 공고 인원 2/2명으로 즉시 [모집 마감] 전환
            System->>System: D-day 1:1 확정 약속(Appointment) 생성
        end
        System-->>Guest: 🎉 매칭 확정 알림 발송
        System-->>Host: 🎉 매칭 확정 알림 발송
        System->>Chat: 1:1 전용 안심 채팅방 자동 개설
    else 호스트가 거절(Reject)한 경우
        Host->>System: 거절 버튼 클릭
        System->>System: 해당 신청 Status -> 'rejected'
        System-->>Guest: 매칭 미성사 알림 (공고는 계속 1/2명 모집중 유지)
    end
```

---

### Flow 6. 마이페이지(Me) 통합 동행 신청 관리 (MyPage Request Management)
헤더의 복잡한 버튼을 제거하고, 마이페이지 상단 2개 탭으로 신청 내역을 일원화 관리합니다.

```mermaid
flowchart TD
    MeTab[하단 Me 탭 진입] --> RequestCard[1:1 동행 신청 관리 카드]
    
    RequestCard --> SubTabs{서브 탭 선택}
    
    SubTabs -->|동행 신청한 건| SentTab[보낸 신청 목록]
    SentTab --> SentPending[⏳ 대기중: 호스트 검토 중]
    SentTab --> SentAccepted[🎉 확정: 약속 대시보드 바로가기]
    SentTab --> SentRejected[❌ 마감: 다른 동행 탐색 유도]
    
    SubTabs -->|동행 신청 받은 건| ReceivedTab[받은 신청 목록]
    ReceivedTab --> RecvPending[신청자 당도/메시지 확인]
    RecvPending --> ActionAccept[수락하기 &rarr; Single Lock 발동]
    RecvPending --> ActionReject[거절하기 &rarr; 신청함에서 정리]
    ReceivedTab --> RecvClosed[이미 매칭 완료된 지난 신청건]
```

---

### Flow 7. D-day 7일 이하 홈 리마인드 & 참여 대시보드 (D-day & Dashboard Flow)
약속 7일 전부터 홈 화면 최상단에 카운트다운 리마인드를 가로 캐러셀로 제공합니다.

```mermaid
flowchart TD
    CheckAppt{확정된 약속 일수 체크}
    CheckAppt -->|D-day > 7일| HideCard[홈 리마인드 미노출<br/>D-12 등 먼 일정은 제외]
    CheckAppt -->|D-day <= 7일| ShowCard[홈 상단 약속 리마인드 노출]
    
    ShowCard --> MultiCheck{확정 건수}
    MultiCheck -->|1건| SingleCard[단일 약속 카드 표시]
    MultiCheck -->|2건 이상| RollingCarousel[가로 스냅 스크롤 캐러셀<br/>인디케이터 바 + 좌우 넘김]
    
    SingleCard --> OpenDash[참여 대시보드 바로가기]
    RollingCarousel --> OpenDash
    
    OpenDash --> DashboardModal[약속 참여 대시보드]
    
    DashboardModal --> D1[파트너 프로필 & 당도 확인]
    DashboardModal --> D2[비밀 만남 장소 공개 확인]
    DashboardModal --> D3[1:1 안심 음성통화]
    DashboardModal --> D4[실시간 도착 알림 전송]
    DashboardModal --> D5[동행 안전 수칙 가이드]
    DashboardModal --> D6[긴급 상황 112/고객센터 신고]
    DashboardModal --> D7[동행 완료 후 당도 평가]
```

---

### Flow 8. 동행 완료 후 상호 블라인드 평가 (Review & Settlement Flow)
만남 종료 후 상대방에 대한 평가가 상호 완료될 때까지 비공개 처리하여 솔직한 피드백을 보장합니다.

```mermaid
sequenceDiagram
    autonumber
    actor Host as 호스트
    actor Guest as 게스트
    participant ReviewSys as 상호 블라인드 리뷰 시스템
    participant Sugar as 당도 지수 엔진

    Note over Host, Guest: 동행 완료 (약속 시간 경과 후)
    Host->>ReviewSys: 게스트 평가 작성 (매너 태그, 꿀단지 점수, 코멘트)
    Note over ReviewSys: 호스트 평가 제출 완료 (게스트에게는 비공개)
    
    Guest->>ReviewSys: 호스트 평가 작성 (매너 태그, 꿀단지 점수, 코멘트)
    Note over ReviewSys: 양측 평가 제출 완료 확인!
    
    critical 블라인드 해제 & 당도 반영
        ReviewSys->>ReviewSys: 양측 리뷰 동시 공개 (마이페이지 후기 탭)
        ReviewSys->>Sugar: 긍정 피드백 반영 &rarr; 당도 점수 상승 (예: +3도)
        opt 프로 동행인 경우
            ReviewSys->>ReviewSys: 에스크로 예치금 호스트 계좌로 자동 정산(Released)
        end
    end
    ReviewSys-->>Host: 당도 업데이트 알림
    ReviewSys-->>Guest: 당도 업데이트 알림
```

---

## 3. 📊 핵심 엔티티 상태 전이도 (State Transitions)

### 1) 동행 공고 (MeetupPost) 상태
| 상태 값 | 화면 표시 | 조건 및 전이 |
|---|---|---|
| `recruiting` | **1/2명 (모집중)** | 공고 등록 직후 기본 상태. 게스트 신청 가능 |
| `closed` | **2/2명 (모집마감)** | 호스트가 1명의 신청을 수락하여 매칭 확정된 상태 |

### 2) 동행 신청 (JoinRequest) 상태
| 상태 값 | 화면 표시 | 조건 및 전이 |
|---|---|---|
| `pending` | **대기중** | 게스트가 신청서를 전송하여 호스트 검토 대기 중 |
| `accepted` | **수락됨 (확정)** | 호스트가 수락하여 1:1 매칭이 성사된 상태 |
| `rejected` | **거절됨 (마감)** | 호스트가 거절했거나, 다른 게스트가 수락되어 자동 마감된 상태 |

### 3) 약속 리마인드 (Appointment) 노출 정책
| 조건 | 홈 화면 노출 여부 | UI 형태 |
|---|---|---|
| `D-day <= 7일` (1건) | **노출** | 단일 약속 카드 |
| `D-day <= 7일` (2건 이상) | **노출** | 가로 스냅 스크롤 롤링 캐러셀 + 바 인디케이터 |
| `D-day > 7일` (D-8 ~) | **미노출** | 홈 화면 미노출 (마이페이지/채팅에서만 조회) |

---

## 4. 🛡️ 예외 처리 & 안전 정책 (Edge Cases & Safety Rules)

1. **본인 공고 신청 차단**:
   - 자신이 작성한 동행 공고에는 '신청하기' 버튼 대신 '내가 작성한 공고입니다' 안내 표시.
2. **동행 인원 1:1 엄격 제한**:
   - 모든 모집 공고는 최대 정원 2명(호스트 1명 + 게스트 1명)으로 강제 고정.
3. **비밀 장소 보안 유지**:
   - 상세 만남 장소(예: 식당 예약석 번호, 돗자리 정확한 위치)는 매칭이 확정된 파트너에게만 D-day 대시보드에서 해금.
4. **이미지 로드 실패 Fallback**:
   - 프로필 사진 또는 이벤트 배너가 네트워크 사정 등으로 실패할 경우, 앱 전용 고화질 디폴트 아바타/플레이스홀더로 자동 대체되어 UI 깨짐 방지.
5. **동행 전 긴급 취소 및 에스크로 보호**:
   - 프로 동행 결제 시 에스크로는 만남이 안전하게 완료된 후 정산되며, 사전 취소 시 전액 환불 정책 적용.
