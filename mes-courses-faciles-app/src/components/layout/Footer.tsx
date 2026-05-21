export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white pt-16 pb-24 lg:pb-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-brand-primary">Mes Courses Faciles</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              La première plateforme e-commerce au Gabon qui vous connecte directement à vos magasins préférés de Libreville.
            </p>
            <div className="flex gap-4">
              {['FB', 'IG', 'TW'].map(s => (
                <div key={s} className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-brand-primary transition-colors cursor-pointer">
                  <span className="text-xs font-bold">{s}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-6">Navigation</h4>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li className="hover:text-white cursor-pointer transition-colors">Tous les magasins</li>
              <li className="hover:text-white cursor-pointer transition-colors">Promotions</li>
              <li className="hover:text-white cursor-pointer transition-colors">Devenir partenaire</li>
              <li className="hover:text-white cursor-pointer transition-colors">Blog</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6">Aide</h4>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li className="hover:text-white cursor-pointer transition-colors">Centre d&apos;aide</li>
              <li className="hover:text-white cursor-pointer transition-colors">Suivre ma commande</li>
              <li className="hover:text-white cursor-pointer transition-colors">Livraison & Retours</li>
              <li className="hover:text-white cursor-pointer transition-colors">Contact</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6">Paiement Sécurisé</h4>
            <div className="flex flex-wrap gap-2">
              {['Airtel Money', 'Moov Money', 'Mobicash', 'Carte Bancaire'].map((mode) => (
                <span key={mode} className="bg-slate-800 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-300 border border-slate-700">
                  {mode}
                </span>
              ))}
              <span className="bg-brand-primary/20 text-brand-primary px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-brand-primary/30">
                Paiement à la Livraison
              </span>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-xs font-medium">
          <p>© {new Date().getFullYear()} Mes Courses Faciles - Fait avec passion à Libreville.</p>
          <div className="flex gap-6">
             <span className="hover:text-white cursor-pointer">Mentions Légales</span>
             <span className="hover:text-white cursor-pointer">Confidentialité</span>
             <span className="hover:text-white cursor-pointer">CGV</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
