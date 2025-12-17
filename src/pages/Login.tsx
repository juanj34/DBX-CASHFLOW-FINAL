import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp } from "lucide-react";

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl p-8 space-y-6 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#CCFF00]/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#CCFF00]" />
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-white">Dubai Investment Hub</h1>
            <p className="text-sm text-gray-400">Advisory Platform</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-[#0d1117]">
              <TabsTrigger value="login" className="data-[state=active]:bg-[#2a3142] data-[state=active]:text-white text-gray-400">Sign in</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-[#2a3142] data-[state=active]:text-white text-gray-400">Sign up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="mt-6">
              <LoginForm />
            </TabsContent>
            
            <TabsContent value="signup" className="mt-6">
              <SignupForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Login;
