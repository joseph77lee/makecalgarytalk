const finishSignUp = () => {
  return (
    <div className="w-full">
      <div className="w-full pb-10">
        <div className="w-[370px] bg-white mx-auto items-center flex flex-col shadow-md rounded-xl px-4 sm:px-6 md:px-8 lg:px-10 py-8 max-w-md">
          <div className="font-medium self-center text-xl sm:text-3xl text-gray-700">
            <p>이메일 확인</p>
          </div>
          <div className="mt-4 self-center text-xl sm:text-sm text-gray-800">
            <p className="mb-5">
              {
                "가입해 주셔서 감사합니다! 방금 제공하신 이메일 주소로 인증 이메일을 전송했습니다."
              }
            </p>
            <p className="mb-5">
              {
                "이메일을 받지 못하셨댜면 스팸 폴더를 확인하시거나 새로운 인증 이메일을 요청해보세요."
              }
            </p>
            <p className="w-full text-xs text-gray-600 mb-4 flex items-center">
              <span className="w-1/5 h-[1px] bg-zinc-400 inline-flex"></span>
              <span className="w-3/5 text-center">
                Email Verification Required
              </span>
              <span className="w-1/5 h-[1px] bg-zinc-400 inline-flex"></span>
            </p>
            <p className="mb-5">
              {
                "Thank you for signing up! We've just sent a verification email to the address you provided."
              }
            </p>
            <p>
              {
                "Didn't receive the email? Check your spam folder or request a new verification email."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default finishSignUp;
