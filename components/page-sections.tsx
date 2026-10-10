export default function PageSections({sections}:{sections:any[]}){
 return <>{sections.filter(s=>s.enabled).sort((a,b)=>a.sortOrder-b.sortOrder).map((s,i)=><section key={s.id||`${s.sectionKey}-${i}`} className="container cms-page-section">
 {s.title&&<h2>{s.title}</h2>}{s.subtitle&&<p className="cms-section-subtitle">{s.subtitle}</p>}
 {s.imageUrl&&<img src={s.imageUrl} alt={s.title||""} className="cms-section-image"/>}
 {s.videoUrl&&<video src={s.videoUrl} controls className="cms-section-video"/>}
 {s.content&&<div className="cms-section-content whitespace-pre-wrap">{s.content}</div>}
 </section>)}</>;
}