import React, { useState, useEffect } from 'react';
import './BookPage.css';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header'; // ✅ 공통 헤더 추가

const BookPage = () => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortOrder, setSortOrder] = useState('최신순');
  const [activeCategory, setActiveCategory] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeProductType, setActiveProductType] = useState('책');
  
  // ✅ 학년/학기 필터링 상태
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null); // 학년 표시용
  const [expandedGrade, setExpandedGrade] = useState(null); // 학기 표시용
  
  //여기서부턴 어드민 세션 전용
  const [isAdmin, setIsAdmin] = useState(false);
  
  // 사용자 정보 확인
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setIsAdmin(user.role === 'admin');
      } catch (err) {
        console.error('사용자 정보 파싱 오류:', err);
      }
    }
  }, []);
  const [editTarget, setEditTarget] = useState(null);
  const [newStock, setNewStock] = useState('');
  const [discountRate, setDiscountRate] = useState('');
  
  // 기본 목록 + 카테고리 로딩
  useEffect(() => {
    if (!isSearching) {
      fetchBooks();
    }
    fetchCategories();
  }, [currentPage, sortOrder, activeCategory, activeProductType, isSearching, selectedGrade, selectedSemester]);

  // 검색 중일 때 페이지 변경 감지용
  useEffect(() => {
    if (isSearching) {
      handleSearch();
    }
  }, [currentPage]);

  // 검색어 초기화 감지
  useEffect(() => {
    if (keyword.trim() === '') {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [keyword]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      
      // ✅ 학년/학기 파라미터 추가
      let url = `${process.env.REACT_APP_API_BASE}/api/data?page=${currentPage}&sort=${sortOrder}&category=${activeCategory}&product_type=${activeProductType}&admin=${isAdmin.toString()}`;
      
      if (selectedGrade) {
        url += `&grade=${selectedGrade}`;
      }
      if (selectedSemester) {
        url += `&semester=${selectedSemester}`;
      }
      
      const response = await fetch(url);
      
      // 응답 상태 확인
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // 응답 타입 확인
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("JSON이 아닌 응답:", text);
        throw new Error("서버에서 JSON이 아닌 응답을 받았습니다");
      }
      
      const result = await response.json();
      setBooks(result.data);
      const totalCount = result.pagination?.total || 0;
      setTotalPages(Math.max(1, Math.ceil(totalCount / 9)));
    } catch (err) {
      console.error("도서 데이터 로딩 실패:", err);
      setError("서버와의 연결에 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE}/api/categories`);
      const data = await response.json();
      setCategories([{ id: 'all', name: '전체' }, ...data]);
    } catch (err) {
      console.error('카테고리 로딩 실패:', err);
    }
  };

const handleSearch = async () => {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_BASE}/api/search`, {
        params: {
          query: trimmedKeyword,
          product_type: activeProductType,
          category_id: activeCategory,
          admin: isAdmin,
          page: currentPage,
          limit: 9
        },
      });
      setSearchResults(response.data.data);
      const totalCount = response.data.pagination?.total || 0;
      setTotalPages(Math.max(1, Math.ceil(totalCount / 9))); // ✅ 페이지 수 계산
    } catch (error) {
      console.error('검색 실패:', error);
      setSearchResults([]);
    }
  };

  const handleAddToCart = async (product_id) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE}/api/cart`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ product_id, quantity: 1 }),
      });
      
      if (response.status === 401) {
        alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      
      const data = await response.json();
      alert(data.message || '장바구니에 추가되었습니다.');
    } catch (err) {
      console.error('장바구니 추가 실패:', err);
      alert('장바구니 추가에 실패했습니다.');
    }
  };

  const handleSortChange = (e) => setSortOrder(e.target.value);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleStockUpdate = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    const stockNum = Number(newStock);
    const rateNum = discountRate === '' || isNaN(Number(discountRate)) ? 0 : Number(discountRate);

    // 유효성 검사
    if (isNaN(stockNum)) {
      alert('재고 수량이 숫자가 아닙니다.');
      return;
    }

    const discountedPrice = Math.round(editTarget.original_price * (1 - rateNum / 100));

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE}/api/products/${editTarget.product_id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          stock_quantity: stockNum,
          price: discountedPrice
        })
      });

      if (response.ok) {
        setBooks(prev =>
          prev.map(b =>
            b.product_id === editTarget.product_id
              ? {
                  ...b,
                  stock_quantity: stockNum,
                  price: discountedPrice,
                  discount_rate: rateNum // 필요 시 discount_rate도 갱신
                }
              : b
          )
        );
        alert('수정이 완료되었습니다.');
        setEditTarget(null);
      } else {
        const errorMsg = await response.json();
        alert(`수정 실패: ${errorMsg.error || '알 수 없는 오류'}`);
      }
    } catch (err) {
      console.error('수정 오류:', err);
      alert('서버 오류');
    }
  };

  return (
<div className="bookstore-container">
      <Header keyword={keyword} setKeyword={setKeyword} onSearch={handleSearch} />

      <div className="content-container">
        {/* 사이드바 */}
        <div className="sidebar">
          <div className="category-section">
            <h3>도서</h3>
            <ul className="category-list">
              {categories.map((category) => (
                <li key={category.id}>
                  <div
                    className={`category-item ${activeProductType === '책' && activeCategory === category.id && !selectedGrade ? 'active' : ''}`}
                    onClick={() => {
                      setActiveProductType('책');
                      setActiveCategory(category.id);
                      setCurrentPage(1);
                      setIsSearching(false);
                      
                      // ✅ 전체인 경우 학년/학기 초기화
                      if (category.id === 'all') {
                        setSelectedGrade(null);
                        setSelectedSemester(null);
                        setExpandedCategory(null);
                        setExpandedGrade(null);
                      } else {
                        // ✅ 학과 클릭 시 학년 토글
                        if (expandedCategory === category.id) {
                          setExpandedCategory(null);
                          setSelectedGrade(null);
                          setSelectedSemester(null);
                          setExpandedGrade(null);
                        } else {
                          setExpandedCategory(category.id);
                          setSelectedGrade(null);
                          setSelectedSemester(null);
                          setExpandedGrade(null);
                        }
                      }
                    }}
                  >
                    {category.name}
                    {category.id !== 'all' && (
                      <span style={{ float: 'right' }}>
                        {expandedCategory === category.id ? '▼' : '▶'}
                      </span>
                    )}
                  </div>
                  
                  {/* ✅ 학년 목록 */}
                  {expandedCategory === category.id && category.id !== 'all' && (
                    <ul style={{ paddingLeft: '20px', marginTop: '5px' }}>
                      {[1, 2, 3, 4].map((grade) => (
                        <li key={grade}>
                          <div
                            className={`category-item ${selectedGrade === grade && !selectedSemester ? 'active' : ''}`}
                            style={{ fontSize: '14px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedGrade(grade);
                              setCurrentPage(1);
                              
                              // ✅ 학년 클릭 시 학기 토글
                              if (expandedGrade === grade) {
                                setExpandedGrade(null);
                                setSelectedSemester(null);
                              } else {
                                setExpandedGrade(grade);
                                setSelectedSemester(null);
                              }
                            }}
                          >
                            {grade}학년
                            <span style={{ float: 'right' }}>
                              {expandedGrade === grade ? '▼' : '▶'}
                            </span>
                          </div>
                          
                          {/* ✅ 학기 목록 */}
                          {expandedGrade === grade && (
                            <ul style={{ paddingLeft: '20px', marginTop: '5px' }}>
                              {[1, 2].map((semester) => (
                                <li
                                  key={semester}
                                  className={`category-item ${selectedSemester === semester ? 'active' : ''}`}
                                  style={{ fontSize: '13px' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedSemester(semester);
                                    setCurrentPage(1);
                                  }}
                                >
                                  {semester}학기
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
              <li
                className={`category-item ${activeProductType === '전자책' ? 'active' : ''}`}
                onClick={() => {
                  setActiveProductType('전자책');
                  setActiveCategory('all');
                  setCurrentPage(1);
                  setIsSearching(false);
                }}
              >
                전자책
              </li>
            </ul>
          </div>

          <div className="category-section" style={{ marginTop: '30px' }}>
            <h3>문구류</h3>
            <ul className="category-list">
              <li
                className={`category-item ${activeProductType === '문구류' ? 'active' : ''}`}
                onClick={() => {
                  setActiveProductType('문구류');
                  setActiveCategory('all');
                  setCurrentPage(1);
                  setIsSearching(false);
                  // ✅ 학년/학기 초기화
                  setSelectedGrade(null);
                  setSelectedSemester(null);
                  setExpandedCategory(null);
                  setExpandedGrade(null);
                }}
              >
                문구류
              </li>
            </ul>
          </div>
          
          {isAdmin && (
            <div className="category-section" style={{ marginTop: '30px' }}>
              <h3>📉 재고 주의 상품</h3>
              <ul className="category-list">
                <li
                  className={`category-item ${activeCategory === 'lowstock' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveProductType('all');
                    setActiveCategory('lowstock');
                    setCurrentPage(1);
                    setIsSearching(false);
                    // ✅ 학년/학기 초기화
                    setSelectedGrade(null);
                    setSelectedSemester(null);
                    setExpandedCategory(null);
                    setExpandedGrade(null);
                  }}
                >
                  재고 5개 이하
                </li>
              </ul>
            </div>
          )}

          {isAdmin && (
            <div className="category-section" style={{ marginTop: '30px' }}>
              <h3>❌ 재고 소진</h3>
              <ul className="category-list">
                <li
                  className={`category-item ${activeCategory === 'outofstock' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveProductType('all');
                    setActiveCategory('outofstock');
                    setCurrentPage(1);
                    setIsSearching(false);
                    // ✅ 학년/학기 초기화
                    setSelectedGrade(null);
                    setSelectedSemester(null);
                    setExpandedCategory(null);
                    setExpandedGrade(null);
                  }}
                >
                  재고 소진 상품
                </li>
              </ul>
            </div>
          )}

        </div>

        {/* 메인 콘텐츠 */}
        <div className="main-content">
          <div className="sort-options">
            <span>정렬: </span>
            <select value={sortOrder} onChange={handleSortChange}>
              <option value="낮은가격순">낮은가격순</option>
              <option value="높은가격순">높은가격순</option>
            </select>
          </div>

          {/* 도서 목록 or 검색 결과 */}
          {loading ? (
            <div className="loading">로딩 중...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (isSearching ? searchResults : books).length === 0 ? (
            <div className="no-results">상품이 없습니다.</div>
          ) : (
<div className="sub-book-grid">
  {(() => {
    const data = isSearching ? searchResults : books;
    const visibleItems = data; // 이미 필터된 결과라고 가정
    const remainder = visibleItems.length % 3;
    const placeholders = remainder === 0 ? [] : Array(3 - remainder).fill(null);

    return (
      <>
      {visibleItems.map(book => (
        <div key={book.product_id} className="sub-book-item">
          <div className="book-image">
            {book.image_url ? (
              <img src={book.image_url} alt={book.product_name} />
            ) : (
              <div className="placeholder">이미지 없음</div>
            )}
          </div>
          <div className="book-info">
            <h3 className="book-title">{book.product_name}</h3>
            {book.product_type === '책' && (
              <>
                <p className="book-author">저자: {book.author}</p>
                <p className="book-publisher">출판사: {book.publisher}</p>
                {book.grade && book.semester && (
                  <p className="book-grade-semester" style={{ fontSize: '13px', color: '#666' }}>
                    📚 {book.grade}학년 {book.semester}학기
                  </p>
                )}
              </>
            )}

            {isAdmin && (
              <p className="book-stock">
                재고 수량: <span className="stock-number">{book.stock_quantity}개</span>
              </p>
            )}

            <div className="book-price">
              {book.original_price > book.price ? (
                <>
                  <span className="original-price">
                    {Number(book.original_price).toLocaleString()}원
                  </span>
                  <span className="sale-price">
                    {Number(book.price).toLocaleString()}원
                  </span>
                  <span className="discount-rate">
                    (
                    {Math.round(
                      ((book.original_price - book.price) / book.original_price) * 100
                    )}
                    %)
                  </span>
                </>
              ) : (
                <span className="sale-price">
                  {Number(book.price).toLocaleString()}원
                </span>
              )}

              <div className="book-button-container">
                {isAdmin ? (
                  <button
                    className="edit-button"
                    onClick={() => {
                      setEditTarget(book);
                      setDiscountRate('');
                      setNewStock(book.stock_quantity.toString());
                    }}
                  >
                    수정
                  </button>
                ) : (
                  <button
                    className="add-to-cart-button"
                    onClick={() => handleAddToCart(book.product_id)}
                  >
                    장바구니
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
{placeholders.map((_, i) => (
  <div key={`placeholder-${i}`} className="sub-book-item" style={{ visibility: 'hidden' }} />
))}

      </>
    );
  })()}
</div>
          )}

{/* 페이지네이션 */}
<div className="pagination">
  <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
    &lt;
  </button>
  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
    <button
      key={page}
      className={`page-button ${currentPage === page ? 'active' : ''}`}
      onClick={() => handlePageChange(page)}
    >
      {page}
    </button>
  ))}
  <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
    &gt;
  </button>
</div>
        </div>
      </div>
      {/* 재고 수량 수정 모달창 */}
      {editTarget && (
        <div className="modal-overlay" onClick={() => setEditTarget(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <h3>📦 상품 수정</h3>
            <p><strong>{editTarget.product_name}</strong></p>

            <label>재고 수량</label>
            <input
              type="number"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
              min="0"
              style={{ padding: '8px', marginBottom: '10px', width: '80%' }}
            />

            <label>할인율 (%)</label>
            <input
              type="number"
              value={discountRate}
              onChange={(e) => setDiscountRate(e.target.value)}
              min="0"
              max="100"
              style={{ padding: '8px', marginBottom: '10px', width: '80%' }}
            />

            {discountRate !== '' && !isNaN(discountRate) && (
              <p style={{ color: 'red', marginBottom: '10px' }}>
                💸 할인된 가격: <strong>
                  {(editTarget.original_price * (1 - discountRate / 100)).toLocaleString()}원
                </strong>
              </p>
            )}

            <div>
              <button onClick={handleStockUpdate} className="reservation-button">수정 완료</button>
              <button onClick={() => setEditTarget(null)} className="cancel-button" style={{ marginLeft: '10px' }}>취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookPage;