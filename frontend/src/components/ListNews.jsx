export default function ListNews() {
  const news = [
    { id: 1, title: 'Hướng dẫn phòng ngừa cúm mùa 2026', desc: 'Các biện pháp hữu hiệu giúp gia đình bạn tránh xa virus cúm trong mùa đông này.', date: '12/02/2026', image: 'https://images.unsplash.com/photo-1584634731339-252c581abfc5?w=500' },
    { id: 2, title: 'Lợi ích của việc kiểm tra sức khỏe định kỳ', desc: 'Tại sao việc khám tổng quát mỗi 6 tháng lại quan trọng đối với người trên 30 tuổi?', date: '10/02/2026', image: 'https://images.unsplash.com/photo-1504813184591-01592fd03cfd?w=500' },
    { id: 3, title: 'Dinh dưỡng vàng cho trẻ nhỏ', desc: 'Chế độ ăn uống giúp phát triển trí não và thể chất tối ưu cho bé từ 0-5 tuổi.', date: '08/02/2026', image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=500' },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-12">Cẩm nang y tế</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {news.map(item => (
            <div key={item.id} className="bg-white rounded-3xl overflow-hidden border border-gray-50 flex flex-col group cursor-pointer shadow-sm hover:shadow-xl transition-all">
              <div className="h-48 overflow-hidden">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <span className="text-xs font-bold text-blue-500 mb-2">{item.date}</span>
                <h3 className="font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{item.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-3 mb-4">{item.desc}</p>
                <div className="mt-auto text-blue-600 font-bold text-xs uppercase tracking-widest flex items-center gap-1">
                  Đọc thêm →
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
