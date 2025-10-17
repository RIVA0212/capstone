
DROP DATABASE IF EXISTS `capstone`;
CREATE DATABASE `capstone` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `capstone`;

-- ========================================
-- 사용자 테이블
-- ========================================
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 관리자 계정 생성
INSERT INTO `users` VALUES (1,'admin','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','관리자',NULL,NULL,'admin','2025-01-01 00:00:00','2025-01-01 00:00:00');

-- ========================================
-- 상품 테이블
-- ========================================
CREATE TABLE `product` (
  `product_id` int NOT NULL AUTO_INCREMENT,
  `product_name` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `product_type` enum('책','문구류','전자책') NOT NULL,
  `stock_quantity` int NOT NULL DEFAULT '0',
  `is_active` enum('true','false') NOT NULL DEFAULT 'true',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
INSERT INTO `product` VALUES (1,'전기기초실험',16000.00,'/images/1.jpg','책',10,'true','2025-05-03 12:50:38','2025-05-24 04:02:51'),(2,'이론과 함께 하는 전자회로 실험',26000.00,'/images/2.jpg','책',10,'true','2025-05-03 12:50:38','2025-05-03 12:50:38'),(3,'NCS기반 전기회로 실험',22000.00,'/images/3.jpg','책',10,'true','2025-05-03 12:50:38','2025-05-03 12:50:38'),(4,'컴퓨터 활용과 실습 2019',25000.00,'/images/4.jpg','책',10,'true','2025-05-03 12:50:38','2025-05-03 12:50:38'),(5,'전자회로',42000.00,'/images/5.jpg','책',10,'true','2025-05-03 12:50:38','2025-05-03 12:50:38'),(6,'페도라리눅스 시스템&네트워크',29000.00,'/images/6.jpg','책',10,'true','2025-05-03 12:50:38','2025-05-03 12:50:38'),(7,'2025 회로이론',19800.00,'/images/7.jpg','책',10,'true','2025-05-03 12:50:38','2025-05-03 12:50:38'),(8,'LapVIEW의 정석 기본편',28000.00,'/images/8.jpg','책',10,'true','2025-05-03 12:50:38','2025-05-03 12:50:38'),(9,'쉽게 풀어쓴 C언어 Express개정 4판',32200.00,'/images/9.jpg','책',10,'true','2025-05-03 12:50:38','2025-05-03 12:50:38'),(10,'회로이론기초',15000.00,'/images/10.jpeg','책',10,'true','2025-05-07 05:28:49','2025-05-07 05:47:29'),(11,'실무와 예제로 배우는 PADS VX.O',29000.00,'/images/11.jpg','책',10,'true','2025-05-07 05:28:49','2025-05-07 05:28:49'),(12,'디지털 논리회로 이론, 실습 시뮬레이션 개정 4판',32000.00,'/images/12.jpeg','책',10,'true','2025-05-07 05:28:49','2025-05-07 05:48:16'),(13,'컴퓨터구조론',31000.00,'/images/13.jpg','책',10,'true','2025-05-07 05:28:49','2025-05-07 05:28:49'),(14,'IT CookBook',26000.00,'/images/14.jpeg','책',10,'true','2025-05-07 05:28:49','2025-05-07 05:47:52'),(15,'제5판 통신시스템의 기초',26000.00,'/images/15.jpeg','책',10,'true','2025-05-07 05:28:49','2025-05-07 05:48:23'),(16,'최신전기 AutoCAD',20000.00,'/images/16.jpg','책',10,'true','2025-05-07 05:28:49','2025-05-07 05:28:49'),(17,'2025 전기기기(전기기사시리즈3)',22000.00,'/images/17.jpg','책',10,'true','2025-05-07 05:28:49','2025-05-07 05:28:49'),(18,'자가용 전기설비설계',39000.00,'/images/18.jpg','책',10,'true','2025-05-07 05:28:49','2025-05-07 05:28:49'),(19,'치아형태학 제4판',40000.00,'/images/19.jpg','책',10,'true','2025-05-14 08:26:08','2025-05-14 08:26:08'),(20,'구강해부학',35000.00,'/images/20.jpg','책',10,'true','2025-05-14 08:26:08','2025-05-20 09:18:44'),(21,'관교의치기공학 및 실습',55000.00,'/images/21.jpg','책',10,'true','2025-05-14 08:26:08','2025-05-14 08:26:08'),(22,'총의치기공학',68000.00,'/images/22.jpg','책',10,'true','2025-05-14 08:26:08','2025-05-14 08:26:08'),(23,'[나비엠알오] 사무용 투톤가위 (7인치)',1990.00,'/images/23.jpg','문구류',20,'true','2025-05-14 08:26:08','2025-05-14 08:26:08'),(24,'[3M]포스트잇 노트 (653-4)',2800.00,'/images/24.jpg','문구류',20,'true','2025-05-14 08:26:08','2025-05-14 08:26:08'),(25,'[나비엠알오]스프링 인덱스 노트',3000.00,'/images/25.jpg','문구류',50,'true','2025-05-14 08:26:08','2025-05-14 08:26:08'),(26,'[오피스디포]스프링 인덱스 노트',4500.00,'/images/26.jpg','문구류',20,'true','2025-05-14 08:26:08','2025-05-14 08:26:08'),(27,'[Pentel]아인 지우개',700.00,'/images/27.jpg','문구류',20,'true','2025-05-14 08:26:08','2025-05-14 08:26:08'),(28,'[문화연필]더존 옐로우 연필 (한자루)',2300.00,'/images/28.jpg','문구류',30,'true','2025-05-14 08:26:08','2025-05-14 08:26:08'),(29,'PADS VX.0을 이용한 AVR PCB Art Work 실무',29000.00,'/images/29.jpg','책',10,'true','2025-05-21 02:09:54','2025-05-21 02:09:54'),(30,'알기쉬운 회로이론(12판)',23000.00,'/images/30.jpg','책',10,'true','2025-05-21 02:09:54','2025-05-21 02:09:54'),(31,'기초전자실험 with Pspice',17000.00,'/images/31.jpg','책',10,'true','2025-05-21 02:09:54','2025-05-21 02:09:54'),(32,'4차산업혁명과 정보통신의 이해',25000.00,'/images/32.jpeg','책',10,'true','2025-05-21 02:09:54','2025-05-21 02:09:54'),(33,'4차산업혁명 시대의 정보통신개론',25000.00,'/images/33.jpeg','책',10,'true','2025-05-21 02:09:54','2025-05-21 02:09:54'),(34,'라즈베리파이5와 40개의 작품들',22000.00,'/images/34.jpeg','책',10,'true','2025-05-21 02:09:54','2025-05-21 02:09:54'),(35,'오토캐드 40시간 완성',20000.00,'/images/35.jpeg','책',10,'true','2025-05-21 02:09:54','2025-05-21 02:09:54'),(36,'IT CookBook 전자기학',38000.00,'/images/36.jpeg','책',10,'true','2025-05-21 02:09:54','2025-05-21 02:09:54'),(37,'IT CookBook, 처음 만나는 디지털 논리회로',22000.00,'/images/37.jpg','책',10,'true','2025-05-21 02:09:54','2025-05-21 02:09:54'),(38,'최신 디지털논리회로실험',18000.00,'/images/38.jpg','책',10,'true','2025-05-21 02:09:54','2025-05-21 02:09:54'),(39,'대학기초실험 7판',28000.00,'/images/39.jpeg','책',10,'true','2025-05-21 02:09:54','2025-05-21 02:09:54'),(40,'LabVIEW로 시작하는 임베디드 시스템 myRIO를 이용한 하드웨어실습 ',25000.00,'/images/40.jpg','책',10,'true','2025-05-21 02:09:54','2025-05-21 02:09:54'),(41,'2025 답이보인다 30일 단기완성 전기기사, 산업기사 실기',39000.00,'/images/41.jpeg','책',10,'true','2025-05-21 02:09:54','2025-05-21 02:09:54'),(42,'프로젝트 구현을 위한 아두이노 기초와 응용',20000.00,'/images/42.jpeg','책',10,'true','2025-05-21 02:09:54','2025-05-21 02:09:54'),(43,'스마트치아단계조각법 ',40000.00,'/images/43.jpeg','책',10,'true','2025-05-21 02:09:54','2025-05-21 02:09:54'),(44,'치기공재료학',46000.00,'/images/44.jpeg','책',10,'true','2025-05-21 02:09:54','2025-05-21 02:09:54'),(45,'가철성 국소의치기공학',55000.00,'/images/45.jpeg','책',10,'true','2025-05-21 02:09:54','2025-05-21 02:09:54'),(46,'총의치기공 - 시적의치의 제작',12000.00,'/images/46.jpeg','책',10,'true','2025-05-21 02:09:54','2025-05-21 02:09:54'),(47,'쉽게풀어쓴 C언어 Express(개정4판)',32000.00,'/images/9.jpg','책',10,'true','2025-05-21 02:09:54','2025-05-21 02:09:54'),(48,'IT CookBook, 난생처음 파이썬 프로그래밍',24000.00,'/images/48.jpg','책',10,'true','2025-05-21 13:27:28','2025-05-21 13:27:28'),(49,'포토샵&일러스트레이터CC 2025 무작정 따라하기',26000.00,'/images/49.jpg','책',10,'true','2025-05-21 13:27:28','2025-05-21 13:27:28'),(50,'AI시대의 컴퓨터개론',29000.00,'/images/50.jpg','책',10,'true','2025-05-21 13:27:28','2025-05-21 13:27:28'),(51,'HTML5+CSS3+Javascript 웹 프로그래밍',30000.00,'/images/51.jpg','책',10,'true','2025-05-21 13:27:28','2025-05-24 04:04:35'),(52,'Core C 프로그래밍',27000.00,'/images/52.jpg','책',10,'true','2025-05-21 13:27:28','2025-05-21 13:27:28'),(53,'AI 시대의 파이썬 데이터 분석',28800.00,'/images/53.jpg','책',10,'true','2025-05-21 13:27:28','2025-05-21 13:27:28'),(54,'쉽게 배우는 JSP 웹 프로그래밍',30000.00,'/images/54.jpg','책',10,'true','2025-05-21 13:27:28','2025-05-21 13:27:28'),(55,'명품 JAVA Programming (개정4판)',33000.00,'/images/55.jpg','책',10,'true','2025-05-21 13:27:28','2025-05-24 04:04:35'),(56,'쉽게 배우는 C 자료구조',29000.00,'/images/56.jpg','책',10,'true','2025-05-21 13:27:28','2025-05-21 13:27:28'),(57,'SQL Server로 배우는 데이터베이스 개론과 실습(2판)',29000.00,'/images/57.jpg','책',10,'true','2025-05-21 13:27:28','2025-05-21 13:27:28'),(58,'IT CookBook, 우분투 리눅스 (3판)',34000.00,'/images/58.jpg','책',10,'true','2025-05-21 13:27:28','2025-05-21 13:27:28'),(59,'Step by Step 안드로이드 프로그래밍',32000.00,'/images/59.jpg','책',10,'true','2025-05-21 13:27:28','2025-05-21 13:27:28'),(60,'IT CookBook, 시스템 분석과 설계 (개정판)',25000.00,'/images/60.jpg','책',10,'true','2025-05-21 13:27:28','2025-05-21 13:27:28'),(61,'생활코딩! React 리액트 프로그래밍',25000.00,'/images/61.jpg','책',10,'true','2025-05-21 13:27:28','2025-05-21 13:27:28'),(62,'데이터 과학을 위한 파이썬 머신러닝',30000.00,'/images/62.jpg','책',10,'true','2025-05-21 13:27:28','2025-05-21 13:27:28'),(63,'스프링부트 완전정복',35000.00,'/images/63.jpg','책',10,'true','2025-05-21 13:27:28','2025-05-21 13:27:28'),(64,'알기 쉬운 정보보호개론 3판',29000.00,'/images/64.jpg','책',10,'true','2025-05-21 13:27:28','2025-05-21 13:27:28'),(65,'2024 시나공 정보처리기사 필기 기본서',35000.00,'/images/65.jpg','책',10,'true','2025-05-21 13:27:28','2025-05-21 13:27:28'),(66,'컴퓨터 비전과 딥러닝',39000.00,'/images/66.jpg','책',10,'true','2025-05-21 13:27:28','2025-05-23 15:50:36');

-- ========================================
-- 도서 정보 테이블
-- ========================================
CREATE TABLE `book` (
  `book_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `author` varchar(100) NOT NULL,
  `publisher` varchar(100) NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `published_year` year DEFAULT NULL,
  PRIMARY KEY (`book_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `book_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
INSERT INTO `book` VALUES (1,1,'임헌찬 외 2인','북두출판사','전자공학과',2024),(2,2,'한학근','문운당','전자공학과',2016),(3,3,'한학근','동일출판사','전자공학과',2018),(4,4,'김경희 외 1인','한빛아카데미','정보통신과',2021),(5,5,'김수원 외 7인','홍릉과학출판사','정보통신과',2017),(6,6,'이종원','한빛아카데미','정보통신과',2017),(7,7,'검정연구회','동일출판사','전기과',2024),(8,8,'손혜영','인피니티북스','전기과',2016),(9,9,'천인국','생능출판사','전기과',2023),(10,10,'하정우','북두출판사','전자공학과',2024),(11,11,'오종오, 김승겸','북두출판사','전자공학과',2015),(12,12,'임석구, 홍경호','한빛아카데미','전자공학과',2022),(13,13,'김종현','생능출판','정보통신과',2024),(14,14,'우재남','한빛아카데미','정보통신과',2022),(15,15,'이해선','북두출판사','정보통신과',2023),(16,16,'이충식 외 4명','동일출판사','전기과',2010),(17,17,'검정연구회','동일출판사','전기과',2025),(18,18,'김세동 외 3명','동일출판사','전기과',2025),(19,19,'권순석 외','현문사','치기공과',2025),(20,20,'김기백 외','지성출판사','치기공과',2018),(21,21,'관교의치기공학교육연구회','대학서림','치기공과',2022),(22,22,'총의치기공학연구회','고문사','치기공과',2024),(23,29,'오종오','사이버북스','전자공학과',2015),(24,30,'김종오 외 3명','북두출판사','정보통신과',2019),(25,31,'홍순관','한빛아카데미','정보통신과',2016),(26,32,'김정섭 외 2명','한빛아카데미','정보통신과',2021),(27,33,'고응남','한빛아카데미','정보통신과',2020),(28,34,'장문철','앤써북','정보통신과',2024),(29,35,'신동진','피안피북','정보통신과',2024),(30,36,'김동명','한빛아카데미','전기과',2020),(31,37,'임석구, 홍경호','한빛아카데미','전기과',2016),(32,38,'고재원 외 2명','동일출판사','전기과',2014),(33,39,'최승덕','북두출판사','전기과',2023),(34,40,'장현오','인피니티북스','전기과',2014),(35,41,'검정연구회','동일출판사','전기과',2025),(36,42,'김상원 외 2명','일진사','전기과',2019),(37,43,'권순석, 권은자','지성출판사','치기공과',2022),(38,44,'치기공재료학연구회','고문사','치기공과',2024),(39,45,'국소의치기공학연구회','지성출판사','치기공과',2022),(40,46,'충의치기공학교수철의회','대학서림','치기공과',2021),(41,47,'천안국','생능출판사','전자공학과',2023),(42,48,'우재남, 최민아','한빛아카데미','컴퓨터소프트웨어과',2021),(43,49,'민지영, 문수민 외','길벗','컴퓨터소프트웨어과',2025),(44,50,'강환수 외','인피니티북스','컴퓨터소프트웨어과',2022),(45,51,'황기태','생능출판사','컴퓨터소프트웨어과',2022),(46,52,'천정아','연두에디션','컴퓨터소프트웨어과',2022),(47,53,'오세종','한빛아카데미','컴퓨터소프트웨어과',2025),(48,54,'송미영','한빛아카데미','컴퓨터소프트웨어과',2023),(49,55,'황기태, 김효수','생능출판사','컴퓨터소프트웨어과',2018),(50,56,'최영규, 천인국','생능출판사','컴퓨터소프트웨어과',2024),(51,57,'박우창, 남송휘','한빛아카데미','컴퓨터소프트웨어과',2021),(52,58,'이종원','한빛아카데미','컴퓨터소프트웨어과',2022),(53,59,'장용식 외','인피니티북스','컴퓨터소프트웨어과',2019),(54,60,'허원실','한빛아카데미','컴퓨터소프트웨어과',2015),(55,61,'이고잉','위키북스','컴퓨터소프트웨어과',2023),(56,62,'최성철','한빛아카데미','컴퓨터소프트웨어과',2022),(57,63,'송미영','길벗캠퍼스','컴퓨터소프트웨어과',2024),(58,64,'히로시 유키 외 3명','인피니티북스','컴퓨터소프트웨어과',2017),(59,65,'길벗알앤디','길벗','컴퓨터소프트웨어과',2023),(60,66,'오일석','한빛아카데미','컴퓨터소프트웨어과',2023);

-- ========================================
-- 전자책 테이블
-- ========================================
CREATE TABLE `ebook` (
  `ebook_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `title` varchar(200) NOT NULL,
  `content_url` varchar(500) NOT NULL,
  `file_format` varchar(20) DEFAULT 'pdf',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ebook_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `ebook_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ========================================
-- 전자책 더미 데이터
-- ========================================
-- 샘플 PDF: W3C 제공 더미 파일 사용
-- https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf

-- EBook #1
INSERT INTO `product` (`product_name`,`price`,`image_url`,`product_type`,`stock_quantity`,`is_active`)
VALUES ('리액트 핸드북 (전자책)', 12000.00, '/images/48.jpg', '전자책', 9999, 'true');
SET @ebook_p1 = LAST_INSERT_ID();
INSERT INTO `ebook` (`product_id`,`title`,`content_url`,`file_format`)
VALUES (@ebook_p1, '리액트 핸드북', '/ebooks/sample.pdf', 'pdf');

-- EBook #2
INSERT INTO `product` (`product_name`,`price`,`image_url`,`product_type`,`stock_quantity`,`is_active`)
VALUES ('파이썬 빠른 시작 (전자책)', 9000.00, '/images/53.jpg', '전자책', 9999, 'true');
SET @ebook_p2 = LAST_INSERT_ID();
INSERT INTO `ebook` (`product_id`,`title`,`content_url`,`file_format`)
VALUES (@ebook_p2, '파이썬 빠른 시작', '/ebooks/sample.pdf', 'pdf');

-- EBook #3
INSERT INTO `product` (`product_name`,`price`,`image_url`,`product_type`,`stock_quantity`,`is_active`)
VALUES ('웹 프로그래밍 기초 (전자책)', 10000.00, '/images/51.jpg', '전자책', 9999, 'true');
SET @ebook_p3 = LAST_INSERT_ID();
INSERT INTO `ebook` (`product_id`,`title`,`content_url`,`file_format`)
VALUES (@ebook_p3, '웹 프로그래밍 기초', '/ebooks/sample.pdf', 'pdf');

-- ========================================
-- 주문 테이블
-- ========================================
CREATE TABLE `orders` (
  `order_id` int NOT NULL AUTO_INCREMENT,
  `order_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('준비','완료') NOT NULL DEFAULT '준비',
  `total_amount` decimal(10,2) DEFAULT NULL,
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `phone` varchar(13) DEFAULT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`order_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ========================================
-- 주문 상품 테이블
-- ========================================
CREATE TABLE `order_items` (
  `order_item_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '0',
  `price_per_item` decimal(10,2) NOT NULL,
  PRIMARY KEY (`order_item_id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ========================================
-- 문의 테이블
-- ========================================
CREATE TABLE `questions` (
  `question_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `question` varchar(255) DEFAULT NULL,
  `answer` varchar(255) DEFAULT NULL,
  `passwd` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`question_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_questions_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ========================================
-- 수령 테이블
-- ========================================
CREATE TABLE `receipts` (
  `receipt_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `payment_date` timestamp NULL DEFAULT NULL,
  `receipt_date` timestamp NULL DEFAULT NULL,
  `receipt_status` enum('대기','수령','취소') NOT NULL DEFAULT '대기',
  PRIMARY KEY (`receipt_id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `receipts_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ========================================
-- 테스트용 주문 데이터 (전자책 구매)
-- ========================================
INSERT INTO `orders` (`user_id`, `status`, `total_amount`, `order_date`) VALUES 
(1, '완료', 12000.00, '2025-01-15 10:00:00'),
(1, '완료', 9000.00, '2025-01-15 11:00:00'),
(2, '완료', 10000.00, '2025-01-16 10:00:00');

INSERT INTO `order_items` (`order_id`, `product_id`, `quantity`, `price_per_item`) VALUES 
(1, 67, 1, 12000.00),  -- 관리자가 리액트 핸드북 구매
(2, 68, 1, 9000.00),   -- 관리자가 파이썬 빠른 시작 구매
(3, 69, 1, 10000.00);  -- 사용자2가 웹 프로그래밍 기초 구매