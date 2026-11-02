import './Stepper.css';

interface StepperProps {
  currentStep: 1 | 2 | 3 | 4;
}

const StarIcon = ({ state }: { state: 'completed' | 'active' | 'inactive' }) => {
  if (state === 'completed') {
    return (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glow-star" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feFlood floodColor="#00A0CC" result="color"/>
            <feComposite in="color" in2="blur" operator="in" result="glow"/>
            <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <path
          d="M18 1L21.6 13.4L34 18L21.6 22.4L18 34L14.4 22.4L2 18L14.4 13.4L18 1Z"
          fill="#1987A6"
          stroke="#E6FEFF"
          strokeWidth="0.69"
          strokeLinejoin="round"
          filter="url(#glow-star)"
        />
      </svg>
    );
  }

  if (state === 'active') {
    return (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0px 0px 3px #00A0CC)' }}>
        <path
          d="M18 1L21.6 13.4L34 18L21.6 22.4L18 34L14.4 22.4L2 18L14.4 13.4L18 1Z"
          fill="#1987A6"
          stroke="#E5FEFF"
          strokeWidth="0.69"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // inactive
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M18 1L21.6 13.4L34 18L21.6 22.4L18 34L14.4 22.4L2 18L14.4 13.4L18 1Z"
        fill="#ACBEBF"
      />
    </svg>
  );
};

const Stepper = ({ currentStep }: StepperProps) => {
  const getState = (step: number): 'completed' | 'active' | 'inactive' => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'active';
    return 'inactive';
  };

  const isDividerActive = (afterStep: number) => afterStep < currentStep;

  const steps = [
    '1. Загрузить вакансию',
    '2. Загрузить резюме',
    '3. Загрузить запись\nсобеседования',
    '4. Получить портрет\nкандидата',
  ];

  return (
    <section className="stepper-container">
      <div className="stepper-inner">
        {steps.map((label, i) => {
          const stepNum = i + 1;
          const state = getState(stepNum);
          const isLast = stepNum === 4;

          return (
            <div key={stepNum} className="stepper-step-group">
              <div className="step-item">
                <div className="step-star">
                  <StarIcon state={state} />
                </div>
                <p className={`step-label step-label-${state}`}>
                  {label}
                </p>
              </div>
              {!isLast && (
                <div className={`dots-divider ${isDividerActive(stepNum) ? 'active' : ''}`}>
                  <span/><span/><span/><span/><span/>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Stepper;