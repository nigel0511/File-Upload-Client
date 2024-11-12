import React, { useState, useEffect, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import axios, { AxiosError } from "axios";
import {
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  TextField,
} from "@mui/material";
import z from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import LinearProgress from "@mui/material/LinearProgress";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs, { Dayjs } from "dayjs";
import _ from "lodash";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [page, setPage] = useState(0);
  const ref = useRef<HTMLInputElement | null>(null);

  const Upload = z.object({
    title: z.string().refine((title) => title.length > 0, "Title is required"),
    startDateTime: z.custom<Dayjs>(),
    location: z.string(),
    video: z
      .custom<FileList>()
      .refine((files) => files?.length > 0, "File is required")
      .refine((files) => {
        const arr = Array.from(files);
        const result = arr.map((file) => {
          const fileType = file?.type.split("/");
          if (fileType[0] !== "video") {
            return false;
          } else {
            return true;
          }
        });
        return !result.includes(false);
      }, "Only video is allowed"),
    tc: z
      .boolean()
      .refine((tc) => tc === true, "Please check terms and conditions"),
  });

  type Upload = z.infer<typeof Upload>;

  const defaultValues: Upload = {
    title: "",
    startDateTime: dayjs(new Date()),
    location: "",
    video: {} as FileList,
    tc: false,
  };

  const {
    reset,
    getValues,
    setValue,
    handleSubmit,
    trigger,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Upload>({ defaultValues, resolver: zodResolver(Upload) });

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setValue("video", e.target.files);
      setFile(e.target.files[0]);
    }
  };

  useEffect(() => {
    const file = getValues("video");
    if (file && file[0]?.type.startsWith("video/")) {
      const videoURL = URL.createObjectURL(file[0]);

      setThumbnail(videoURL);
    } else {
      setThumbnail(null);
    }
  }, [file]);

  const submitHandler = async (data: Upload) => {
    const { title, startDateTime, location, video } = data;

    const formData = new FormData();
    formData.append("video", video[0]);
    formData.append("title", title);
    formData.append("location", location);
    formData.append("startDateTime", startDateTime.toISOString());
    formData.append("fileSize", video[0].size.toString());
    formData.append("format", video[0].type.toString());

    try {
      await axios
        .post(SERVER_URL, formData, {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.lengthComputable && progressEvent.total) {
              const percent = Math.round(
                (progressEvent.loaded / progressEvent.total) * 100
              );
              setProgress(percent); // Update progress
            }
          },
        })
        .then((res) => {
          if (res.status === 201)
            toast.success(res.data.message, {
              position: "top-center",
              autoClose: 5000,
            });
          setFile(null);
          setPage(0);
          reset();
        });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<any>;
        const message = axiosError.message ?? "Unknown error";
        toast.error(message, {
          position: "top-center",
          autoClose: 5000,
        });
        console.error("API Error:", message);
      }
    }
  };
  return (
    <div className="flex-col">
      <div className="flex-col flex gap-8">
        <h1>Video Upload</h1>
        <ToastContainer />
        {page === 0 ? (
          <>
            {thumbnail && (
              <>
                <video className="w-full max-w-32">
                  <source src={thumbnail} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </>
            )}
            <FormControl
              disabled={isSubmitting}
              fullWidth
              size="small"
              error={Boolean(errors?.video)}
            >
              <input
                ref={ref}
                id="file"
                type="file"
                accept="video/*"
                className="hidden"
                onChange={onFileChange}
              />

              <button
                type="button"
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition duration-200 ease-in-out"
                onClick={() => ref.current?.click()}
              >
                Select File
              </button>
              {/* <input
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-700 bg-gray-50 outline-none transition duration-200 ease-in-out"
                type="file"
                onChange={onFileChange}
              ></input> */}
              <FormHelperText className=" text-red-600">
                {errors?.video?.message}
              </FormHelperText>
            </FormControl>
            <Controller
              name={"title"}
              control={control}
              render={({ field }) => {
                return (
                  <FormControl
                    disabled={isSubmitting}
                    fullWidth
                    size="small"
                    error={Boolean(errors?.title)}
                  >
                    <TextField placeholder="Title" {...field} />
                    <FormHelperText className=" text-red-600">
                      {errors?.title?.message}
                    </FormHelperText>
                  </FormControl>
                );
              }}
            />
            <Controller
              name={"location"}
              control={control}
              render={({ field }) => {
                return (
                  <FormControl
                    disabled={isSubmitting}
                    fullWidth
                    size="small"
                    error={Boolean(errors?.location)}
                  >
                    <TextField placeholder="Location" {...field} />
                    <FormHelperText className=" text-red-600">
                      {errors?.location?.message}
                    </FormHelperText>
                  </FormControl>
                );
              }}
            />

            <Controller
              name={"startDateTime"}
              control={control}
              render={({ field }) => {
                return (
                  <FormControl
                    disabled={isSubmitting}
                    fullWidth
                    size="small"
                    error={Boolean(errors?.startDateTime)}
                  >
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DemoContainer components={["DateTimePicker"]}>
                        <DateTimePicker
                          label="Basic date time picker"
                          {...field}
                        />
                      </DemoContainer>
                    </LocalizationProvider>
                    <FormHelperText className=" text-red-600">
                      {errors?.startDateTime?.message}
                    </FormHelperText>
                  </FormControl>
                );
              }}
            />
          </>
        ) : (
          page === 1 && (
            <>
              {isSubmitting && (
                <>
                  <p>Video uploading... please wait - {progress}%</p>
                  <LinearProgress variant="determinate" value={progress} />
                </>
              )}
              <Controller
                name={"tc"}
                control={control}
                rules={{ required: "You must accept the terms and conditions" }}
                render={({ field }) => {
                  return (
                    <FormControl
                      disabled={isSubmitting}
                      fullWidth
                      size="small"
                      error={Boolean(errors?.tc)}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox checked={getValues("tc")} {...field} />
                        }
                        label="Fake terms and Conditions"
                      />
                      <FormHelperText className=" text-red-600">
                        {errors?.tc?.message}
                      </FormHelperText>
                    </FormControl>
                  );
                }}
              />
            </>
          )
        )}
      </div>
      <div className="flex gap-6 justify-center m-4">
        {page === 1 && (
          <Button
            disabled={isSubmitting}
            className="w-32"
            onClick={() => setPage(page > 0 ? page - 1 : page)}
          >
            Previous
          </Button>
        )}

        {page === 0 ? (
          <Button
            disabled={isSubmitting}
            className="w-32"
            onClick={async () => {
              const isValid = await trigger(["title", "video"]);
              if (isValid) setPage(page < 1 ? page + 1 : page);
            }}
          >
            Next
          </Button>
        ) : (
          <Button
            disabled={isSubmitting}
            className="bg-blue-600 text-white w-32"
            type="submit"
            onClick={handleSubmit(submitHandler)}
          >
            Submit
          </Button>
        )}
      </div>
    </div>
  );
}

export default App;
