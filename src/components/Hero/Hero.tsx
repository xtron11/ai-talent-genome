import './Hero.css';

const Hero = () => {
  return (
    <section className="hero-frame">
      <div className="hero-gray-box">
        <div className="hero-text-frame">
          <h1 className="hero-title">AI Talent Genome</h1>
          <p className="hero-description">
            — Текст описания сервиса (небольшой, упоминание о бета-тестировании)
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;