import { useLanguage } from '../../context/LanguageContext';

export default function ParentPhotos() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useNotification();
  const { t } = useLanguage();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, cRes, fRes] = await Promise.all([
        PhotosApi.getAll().catch(() => ({ data: [] })),
        ChildrenApi.getAll().catch(() => ({ data: [] })),
        FamiliesApi.getAll().catch(() => ({ data: [] }))
      ]);
      const allPhotos = pRes.data || [];
      const allChildren = cRes.data || [];
      const allFamilies = fRes.data || [];
      const myFamily = allFamilies.find(f => f.userId === user.id || f.motherEmail === user.email || f.fatherEmail === user.email);
      if (!myFamily) { setPhotos([]); return; }
      const myChildIds = allChildren.filter(c => c.familyId === myFamily._id).map(c => c._id);
      const filteredPhotos = allPhotos.filter(p => p.childIds?.some(cid => myChildIds.includes(cid)));
      setPhotos(filteredPhotos);
    } catch (err) {
      addToast(t('errorLoadingPhotos') || 'Failed to load photos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleDownload = (p) => {
    const link = document.createElement('a');
    link.href = p.url;
    link.target = '_blank';
    link.download = `${p.title || 'photo'}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      <h2 style={{ marginBottom: 20 }}>📸 {t('photos')}</h2>
      <p style={{ color: '#555', marginBottom: 20 }}>{t('photoDesc') || 'View and download photos of your child\'s activities.'}</p>
      
      {loading ? <div className="spinner"></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
          {photos.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, background: 'white', borderRadius: 12 }}>
              <div style={{ fontSize: '3rem', marginBottom: 10 }}>🖼️</div>
              <h3>{t('noPhotos')}</h3>
              <p>{t('noPhotosDesc') || 'Photos will appear here once uploaded by staff.'}</p>
            </div>
          ) : photos.map(p => (
            <div key={p._id} className="photo-card" style={{ borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <img src={p.url} alt={p.title} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
              <div style={{ padding: 15 }}>
                <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: 5 }}>{p.title}</div>
                <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: 12 }}>📅 {p.date}</div>
                <button 
                  onClick={() => handleDownload(p)}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '10px', fontWeight: 'bold' }}
                >
                  {t('download')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
