import React, { useEffect, useState } from "react";
import Navbar from "../shared/Navbar";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { RadioGroup } from "../ui/radio-group";
import { Button } from "../ui/button";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { USER_API_END_POINT } from "@/utils/constant";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { setLoading, setUser } from "@/redux/authSlice";
import { Loader2 } from "lucide-react";
import image from "../../assets/rb_21826.png";
import Logo from '../ui/Logo';

const Login = () => {
  const [input, setInput] = useState({
    email: "",
    password: "",
    role: "",
  });
  const { loading, user } = useSelector((store) => store.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const changeEventHandler = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      dispatch(setLoading(true));
      const res = await axios.post(`${USER_API_END_POINT}/login`, input, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
      if (res.data.success) {
        dispatch(setUser(res.data.user));
        navigate("/");
        toast.success(res.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response.data.message);
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  return (
    <div>
      <Navbar />
      <div className="flex flex-col md:flex-row w-full md:w-4/5 lg:w-3/4 xl:w-2/3 gap-10 mx-auto mt-10 p-8 sm:p-16 lg:p-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl md:rounded-3xl shadow-lg items-center justify-center">
        <div className="text-center flex flex-col items-center mb-6 text-white">
          <div className="w-full flex flex-col items-center">
            <Logo size="large" />
            <img src={image} alt="Illustration" className="w-full md:w-1/4 lg:w-[450px] hidden md:block mt-4" />
          </div>
        </div>
        <div className="w-full md:w-1/2 flex flex-col items-center">
          <form
            onSubmit={submitHandler}
            className="w-full bg-white rounded-lg shadow-md p-6 sm:p-10 space-y-4 sm:space-y-6"
          >
            <h1 className="font-bold text-2xl sm:text-3xl text-gray-700 text-center">Log In</h1>
            <div>
              <Label htmlFor="email" className="text-base sm:text-lg">
                Your email
              </Label>
              <Input
                type="email"
                value={input.email}
                name="email"
                onChange={changeEventHandler}
                className="mt-1 w-full"
                placeholder="name@company.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-base sm:text-lg">
                Password
              </Label>
              <Input
                type="password"
                value={input.password}
                name="password"
                onChange={changeEventHandler}
                className="mt-1 w-full"
                placeholder="••••••••"
                required
              />
            </div>
            <div className="flex items-center justify-between my-4 sm:my-6">
              <RadioGroup className="flex items-center gap-4 sm:gap-6">
                <div className="flex items-center space-x-2">
                  <Input
                    type="radio"
                    name="role"
                    value="student"
                    checked={input.role === "student"}
                    onChange={changeEventHandler}
                    className="cursor-pointer"
                  />
                  <Label>Applicant</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    type="radio"
                    name="role"
                    value="recruiter"
                    checked={input.role === "recruiter"}
                    onChange={changeEventHandler}
                    className="cursor-pointer"
                  />
                  <Label>Recruiter</Label>
                </div>
              </RadioGroup>
            </div>
            {loading ? (
              <Button className="w-full my-4">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait
              </Button>
            ) : (
              <Button
                type="submit"
                className="w-full my-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg shadow-md transition hover:shadow-lg"
              >
                Login
              </Button>
            )}
            <span className="text-sm block text-center">
              <div>
              Don't have an account?{" "}
              <Link to="/signup" className="text-blue-600 font-semibold ">
                Signup
              </Link>
              </div>
              <button className="my-4">Forget Password</button>
              
            </span>
            
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
