import './Footer.css';

interface FooterProps {
  variant?: 'main' | 'inner';
}

const Footer = ({ variant = 'inner' }: FooterProps) => {
  return (
    <footer className={`footer-container footer-${variant}`}>
      <div className="footer-main-frame">
        <div className="footer-column footer-left">
          <span className="footer-text">AI Talent Genome, 2024</span>
        </div>
        <div className="footer-column footer-center">
          <span className="footer-text clickable">Политика конфиденциальности</span>
        </div>
        <div className="footer-column footer-right">
          <div className="footer-social-frame">
            {[0, 1, 2].map((i) => (
              <div className="social-icon-btn" key={i}>
                <svg width="20" height="20" viewBox="0 0 17.42 17.42" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M11.277 0C12.067 0 12.827 0.166 13.507 0.466C13.737 0.565 13.897 0.771 13.947 1.015C13.987 1.258 13.907 1.508 13.737 1.683L11.507 3.908C11.117 4.297 11.117 4.927 11.507 5.316C11.897 5.705 12.527 5.705 12.917 5.316L15.147 3.092C15.327 2.917 15.577 2.839 15.817 2.885C16.027 2.925 16.217 3.055 16.327 3.238L16.367 3.32C16.667 4.004 16.837 4.759 16.837 5.551C16.837 8.618 14.347 11.102 11.277 11.102C10.667 11.102 10.077 11.003 9.527 10.822L6.307 14.067C5.327 15.047 3.747 15.05 2.767 14.074C1.797 13.101 1.787 11.521 2.757 10.545L5.997 7.294C5.817 6.745 5.717 6.159 5.717 5.551C5.717 2.484 8.207 0 11.277 0ZM11.277 1.5C9.027 1.5 7.217 3.315 7.217 5.551C7.217 6.131 7.337 6.681 7.557 7.178C7.677 7.46 7.617 7.79 7.397 8.009L3.827 11.603C3.437 11.993 3.437 12.624 3.827 13.012C4.217 13.402 4.847 13.4 5.237 13.009L8.807 9.419C9.027 9.2 9.357 9.137 9.647 9.261C10.137 9.48 10.687 9.601 11.277 9.601C13.517 9.601 15.337 7.787 15.337 5.551C15.337 5.384 15.327 5.219 15.307 5.058L13.977 6.378C13.007 7.352 11.427 7.352 10.447 6.378C9.467 5.403 9.467 3.821 10.447 2.847L11.767 1.53C11.607 1.511 11.437 1.5 11.277 1.5Z" fill="white"/>
                </svg>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;