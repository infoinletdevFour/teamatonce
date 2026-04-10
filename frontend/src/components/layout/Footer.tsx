import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Github, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

interface SocialLink {
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  label: string;
}

interface FooterProps {
  /**
   * Company name to display
   */
  companyName?: string;
  /**
   * Company description/tagline
   */
  description?: string;
  /**
   * Footer sections with links
   */
  sections?: FooterSection[];
  /**
   * Social media links
   */
  socialLinks?: SocialLink[];
  /**
   * Copyright year (defaults to current year)
   */
  copyrightYear?: number;
  /**
   * Custom logo component (optional)
   */
  logoComponent?: React.ReactNode;
  /**
   * Show default social links (Github, Globe)
   */
  showDefaultSocial?: boolean;
  /**
   * Custom className for additional styling
   */
  className?: string;
}

const Footer: React.FC<FooterProps> = ({
  companyName = 'Team@Once',
  description,
  sections,
  socialLinks,
  copyrightYear = new Date().getFullYear(),
  logoComponent,
  showDefaultSocial = true,
  className = '',
}) => {
  const { t } = useTranslation();

  // Use translations for default values
  const footerDescription = description || t('footer.description');
  const footerSections = sections || [
    {
      title: t('footer.product.title'),
      links: [
        { label: t('footer.product.features'), href: '/#features' },
        { label: t('footer.product.pricing'), href: '/pricing' },
        { label: t('footer.product.howItWorks'), href: '/#how-it-works' },
        { label: t('footer.product.faq'), href: '/#faq' },
      ],
    },
    {
      title: t('footer.company.title'),
      links: [
        { label: t('footer.company.about'), href: '/#about' },
        { label: t('footer.company.blog'), href: '#' },
        { label: t('footer.company.careers'), href: '#' },
      ],
    },
    {
      title: t('footer.legal.title'),
      links: [
        { label: t('footer.legal.privacy'), href: '/privacy' },
        { label: t('footer.legal.terms'), href: '/terms' },
        { label: t('footer.legal.cookiePolicy'), href: '/cookies' },
        { label: t('footer.legal.gdpr'), href: '/privacy' },
      ],
    },
  ];
  const defaultLogo = (
    <Link to="/" className="flex items-center space-x-3 mb-6">
      <img
        src="/assets/logo.png"
        alt={`${companyName} Logo`}
        className="h-10 w-auto"
      />
      <span className="text-xl font-black text-white">{companyName}</span>
    </Link>
  );

  const defaultSocialLinks: SocialLink[] = [
    {
      icon: Github,
      href: '#',
      label: 'Github',
    },
    {
      icon: Globe,
      href: '#',
      label: 'Website',
    },
  ];

  const displaySocialLinks = socialLinks || (showDefaultSocial ? defaultSocialLinks : []);

  return (
    <footer className={`bg-gray-900 text-gray-400 py-16 px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <div>
            {logoComponent || defaultLogo}
            <p className="text-xs leading-relaxed">{footerDescription}</p>
          </div>

          {/* Footer Sections */}
          {footerSections.map((section, index) => (
            <div key={index}>
              <h4 className="font-bold text-white mb-4">{section.title}</h4>
              <ul className="space-y-3 text-sm">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    {link.href.startsWith('http') || link.href === '#' ? (
                      <a
                        href={link.href}
                        className="hover:text-white transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm">
            {t('footer.copyright', { year: copyrightYear })}
          </p>

          {/* Social Links */}
          {displaySocialLinks.length > 0 && (
            <div className="flex space-x-6 mt-4 md:mt-0">
              {displaySocialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  whileHover={{ scale: 1.2 }}
                  href={social.href}
                  className="hover:text-white transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
