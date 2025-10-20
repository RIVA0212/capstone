const fs = require("fs");
const path = require("path");
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require("docx");

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ text, heading: level });
}

function para(text) {
  return new Paragraph({ children: [new TextRun({ text })] });
}

function bullet(text, level = 0) {
  return new Paragraph({ text, bullet: { level } });
}

async function main() {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          heading("캡스톤 프로젝트 설계서", HeadingLevel.TITLE),
          para("버전: 1.0"),
          para("작성일: " + new Date().toISOString().slice(0, 10)),
          new Paragraph({}),

          heading("설계서(쉬운 설명)", HeadingLevel.HEADING_1),

          bullet("목적: 책과 굿즈를 쉽게 보고 담고 주문해, 매장에서 받을 수 있게 돕는 서비스"),
          bullet("대상: 일반 사용자(고객), 관리자"),

          new Paragraph({}),
          heading("서비스 흐름(쉽게)", HeadingLevel.HEADING_2),
          bullet("회원가입/로그인: 아이디·비밀번호로 가입하고 로그인"),
          bullet("상품 보기/검색: 카테고리로 보거나 검색어로 찾기"),
          bullet("장바구니: 담기, 수량 바꾸기, 삭제하기"),
          bullet("주문 완료: 결제 완료 누르면 재고 확인 후 확정"),
          bullet("수령: 매장에서 받을 때 수령 완료로 변경"),
          bullet("문의: 질문 등록하고 답변 확인"),
          bullet("자동 정리: 7일 지나면 오래된 장바구니·주문 정리"),

          new Paragraph({}),
          heading("화면 사용 설명서", HeadingLevel.HEADING_1),

          bullet("공통"),
          bullet("상단 메뉴로 메인/도서/장바구니/예약내역/문의/마이페이지/로그인 이동", 1),
          bullet("오류는 입력칸 아래나 화면 하단에 안내", 1),
          bullet("모바일에서는 버튼/목록이 크게 보이도록 자동 전환", 1),

          bullet("메인(/)"),
          bullet("추천 도서 카드가 랜덤으로 보임. 도서 보러가기 버튼 제공", 1),

          bullet("도서 목록(/book)"),
          bullet("카테고리와 정렬(최신/가격)을 고를 수 있음", 1),
          bullet("카드에서 상품명/저자/가격/이미지 확인", 1),
          bullet("장바구니 담기(로그인 필요). 수량은 장바구니에서 변경", 1),
          bullet("검색창으로 키워드 검색 가능", 1),

          bullet("장바구니(/cart)"),
          bullet("담은 상품의 수량/가격/합계 확인", 1),
          bullet("수량 +/− 변경, 삭제 가능", 1),
          bullet("결제 완료를 누르면 재고 확인 후 주문 확정", 1),

          bullet("주문 상세(/order-details/:orderId)"),
          bullet("주문일시, 합계, 품목(상품명/저자/수량/가격) 확인", 1),
          bullet("일부 화면은 매장 확인용 QR 제공", 1),

          bullet("예약내역(/reservation)"),
          bullet("완료된 주문 목록을 최근 순으로 보여줌", 1),
          bullet("대표 상품명, 총 수량, 수령 상태 표시. 항목 클릭 시 상세", 1),

          bullet("문의(/inquiry)"),
          bullet("로그인 후 질문 등록, 내 문의 확인", 1),
          bullet("질문 비밀번호로 해당 답변만 열람 가능", 1),
          bullet("관리자는 전체 문의 조회 가능", 1),

          bullet("로그인(/login)"),
          bullet("아이디/비밀번호 입력 후 로그인. 관리자 세션은 페이지 이탈 시 자동 종료", 1),

          bullet("회원가입(/register)"),
          bullet("필수: 아이디/비밀번호/비밀번호 확인/이름. 선택: 전화/이메일", 1),
          bullet("중복확인으로 아이디 사용 가능 여부 확인 후 가입", 1),
          bullet("비밀번호 6자 이상, 두 번 입력이 같아야 함", 1),

          bullet("마이페이지(/mypage)"),
          bullet("주문 통계(총 주문 수, 대기/완료 수, 총 구매액) 확인", 1),
          bullet("비밀번호 변경, 회원 탈퇴 가능(탈퇴 시 내 데이터 함께 삭제)", 1),

          bullet("관리자(내부)"),
          bullet("상품 재고/가격 수정. 재고 0이면 자동으로 판매 중지", 1),
          bullet("관리자 세션은 로그인/로그아웃으로 제어", 1),

          new Paragraph({}),
          heading("데이터(쉽게 설명)", HeadingLevel.HEADING_1),
          bullet("회원: 아이디, 비밀번호(안전 저장), 이름/연락처"),
          bullet("상품: 이름, 가격, 이미지, 유형(책/기타), 재고"),
          bullet("도서 정보: 저자, 출판사, 카테고리(상품과 연결)"),
          bullet("주문: 상태(준비/완료), 일시, 총금액, 연락처"),
          bullet("주문 품목: 각 상품의 수량·가격"),
          bullet("수령 정보: 대기/완료/취소와 날짜"),
          bullet("문의: 질문, 답변, (선택) 열람 비밀번호"),

          new Paragraph({}),
          heading("보안/개인정보(쉽게)", HeadingLevel.HEADING_1),
          bullet("비밀번호는 해독 불가 형태로 저장"),
          bullet("로그인하면 로그인 토큰으로 권한 확인"),
          bullet("관리자 기능은 관리자만 사용 가능"),

          new Paragraph({}),
          heading("오류/안내", HeadingLevel.HEADING_1),
          bullet("입력 누락/형식 오류 시 바로 안내"),
          bullet("네트워크/서버 오류 시 재시도 안내"),
          bullet("주문·수령·탈퇴 등 중요한 동작은 완료 알림"),

          new Paragraph({}),
          heading("자동 정리", HeadingLevel.HEADING_1),
          bullet("장바구니: 7일간 결제 없으면 자동 비움"),
          bullet("주문: 결제 후 7일간 수령 없으면 취소 및 정리")
        ],
      },
    ],
  });

  const outDir = path.join(process.cwd(), "docs");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "설계서_쉬운버전.docx");

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buffer);
  console.log("✅ 문서 생성 완료:", outPath);
}

main().catch((e) => {
  console.error("문서 생성 실패:", e);
  process.exit(1);
});


